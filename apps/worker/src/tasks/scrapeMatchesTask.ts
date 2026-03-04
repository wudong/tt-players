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

function hash(body: string): string {
    return createHash('sha256').update(body).digest('hex');
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
    const matchesRes = await fetch(matchesUrl);
    if (!matchesRes.ok) {
        throw new Error(`HTTP ${matchesRes.status} fetching ${matchesUrl}`);
    }
    const matchesJson = await matchesRes.json();

    // Parse to find completed matches
    const matchesData = MatchesResponseSchema.parse(matchesJson);
    const completedMatches = matchesData.matches.filter((m) => m.hasResults);

    helpers.logger.info(
        `scrapeMatchesTask: ${matchesData.matches.length} matches, ${completedMatches.length} with results`,
    );

    // 2. Fetch sets for each completed match (with rate limiting)
    const setsMap: Record<string, unknown> = {};
    for (const match of completedMatches) {
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
