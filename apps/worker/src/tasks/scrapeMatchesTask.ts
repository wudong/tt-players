import type { Task } from 'graphile-worker';
import { db } from '@tt-players/db';
import { extractAndStore } from '../extractor.js';
import { MatchesResponseSchema } from '../zod-schemas.js';
import { createHash } from 'node:crypto';

export interface ScrapeMatchesPayload {
    /** TT Leagues API division ID */
    divisionId: string;
    platformId: string;
    platformType: 'ttleagues';
    competitionId: string;
}

const TTL_API_BASE = 'https://ttleagues-api.azurewebsites.net/api';
const TTL_RECHECK_COMPLETED_MS = 7 * 24 * 60 * 60 * 1000; // 7d
const SCRAPE_RETRY_DELAY_MS = Number(
    process.env['SCRAPE_RETRY_DELAY_MS'] ?? '10000',
);

function hash(body: string): string {
    return createHash('sha256').update(body).digest('hex');
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithOneRetry(
    url: string,
    helpers: { logger: { info: (msg: string) => void } },
): Promise<Response> {
    const first = await fetch(url);
    if (first.ok) return first;

    helpers.logger.info(
        `scrapeMatchesTask: first attempt failed for ${url} (HTTP ${first.status}), retrying in ${SCRAPE_RETRY_DELAY_MS}ms`,
    );
    await sleep(SCRAPE_RETRY_DELAY_MS);

    const second = await fetch(url);
    if (second.ok) return second;
    throw new Error(`HTTP ${second.status} fetching ${url}`);
}

/**
 * Fetches matches for a TT Leagues division, then fetches sets
 * for each completed match, bundles everything into a single
 * raw payload, stores it in raw_scrape_logs, and chains to
 * processLogTask.
 */
export const scrapeMatchesTask: Task = async (payload, helpers) => {
    const { divisionId, platformId, competitionId } = payload as ScrapeMatchesPayload;

    const matchesUrl = `${TTL_API_BASE}/divisions/${divisionId}/matches`;
    helpers.logger.info(`scrapeMatchesTask: fetching ${matchesUrl}`);

    // 1. Fetch the matches list
    const matchesRes = await fetchWithOneRetry(matchesUrl, helpers);
    const matchesJson = await matchesRes.json();

    // Parse to find completed matches
    const matchesData = MatchesResponseSchema.parse(matchesJson);
    const completedMatches = matchesData.matches.filter((m) => m.hasResults);
    const completedMatchIds = completedMatches.map((m) => String(m.id));

    // Only re-fetch sets for matches that are missing or stale.
    const existingFixtures = completedMatchIds.length
        ? await db
            .selectFrom('fixtures')
            .select(['external_id', 'status', 'updated_at'])
            .where('competition_id', '=', competitionId)
            .where('external_id', 'in', completedMatchIds)
            .execute()
        : [];

    const existingFixtureMap = new Map(
        existingFixtures.map((f) => [f.external_id, f]),
    );

    const nowMs = Date.now();
    const matchesNeedingSets = completedMatches.filter((match) => {
        const fixture = existingFixtureMap.get(String(match.id));
        if (!fixture) return true;
        if (fixture.status !== 'completed') return true;

        const ageMs = nowMs - new Date(fixture.updated_at).getTime();
        return ageMs >= TTL_RECHECK_COMPLETED_MS;
    });

    helpers.logger.info(
        `scrapeMatchesTask: ${matchesData.matches.length} matches, ${completedMatches.length} with results, ${matchesNeedingSets.length} sets fetches required`,
    );

    // 2. Fetch sets for each completed match (with rate limiting)
    const setsMap: Record<string, unknown> = {};
    for (const match of matchesNeedingSets) {
        const setsUrl = `${TTL_API_BASE}/matches/${match.id}/sets`;
        try {
            const setsRes = await fetch(setsUrl);
            if (setsRes.ok) {
                setsMap[String(match.id)] = await setsRes.json();
            } else {
                helpers.logger.info(`scrapeMatchesTask: skip sets for match ${match.id} (HTTP ${setsRes.status})`);
            }
        } catch (err) {
            helpers.logger.info(`scrapeMatchesTask: skip sets for match ${match.id} (${err})`);
        }
        // Rate limit: small delay between requests
        await new Promise((r) => setTimeout(r, 500));
    }

    helpers.logger.info(`scrapeMatchesTask: fetched sets for ${Object.keys(setsMap).length} matches`);

    // 3. Bundle into a single payload
    const bundledPayload = JSON.stringify({
        standings: [], // standings already scraped separately
        matches: matchesJson,
        sets: setsMap,
    });

    // 4. Store in raw_scrape_logs
    const payloadHash = hash(bundledPayload);
    const [log] = await db
        .insertInto('raw_scrape_logs')
        .values({
            platform_id: platformId,
            endpoint_url: `${matchesUrl}?bundled=matches+sets`,
            raw_payload: bundledPayload,
            payload_hash: payloadHash,
            status: 'pending',
        })
        .onConflict((oc) =>
            oc.columns(['endpoint_url', 'payload_hash']).doUpdateSet({
                scraped_at: new Date(),
            }),
        )
        .returning('id')
        .execute();

    helpers.logger.info(`scrapeMatchesTask: stored bundled log ${log!.id}, queuing processLogTask`);

    // 5. Chain to processLogTask with the 'ttleagues-bundle' type
    await helpers.addJob('processLogTask', {
        logId: log!.id,
        competitionId,
        platformId,
        platformType: 'ttleagues-bundle',
    });
};
