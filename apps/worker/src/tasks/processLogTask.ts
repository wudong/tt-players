import type { Task } from 'graphile-worker';
import { db } from '@tt-players/db';
import { parseTTLeaguesData } from '../parser.js';
import {
    parseTT365FixtureMatchCards,
    parseTT365MatchCard,
    parseTT365Standings,
} from '../tt365-parser.js';
import { loadTTLeaguesData } from '../loader.js';
import { reconcilePlayersByName } from '../player-reconciler.js';

const TT365_RECHECK_UPCOMING_MS = 12 * 60 * 60 * 1000; // 12h
const TT365_RECHECK_POSTPONED_MS = 2 * 24 * 60 * 60 * 1000; // 2d
const TT365_RECHECK_COMPLETED_MS = 14 * 24 * 60 * 60 * 1000; // 14d

export interface ProcessLogPayload {
    logId: string;
    competitionId: string;
    platformId: string;
    platformType: 'tt365' | 'ttleagues' | 'ttleagues-bundle';
    tt365DataType?: 'standings' | 'fixtures' | 'matchcard';
    matchExternalId?: string;
}

/**
 * Graphile Worker task: Phase 2 (Transform + Load).
 *
 * Reads raw_payload from raw_scrape_logs and processes it based
 * on the platform type:
 * - "ttleagues": standalone standings JSON array
 * - "ttleagues-bundle": bundled {standings, matches, sets} from scrapeMatchesTask
 * - "tt365" standings: parses standings HTML, upserts teams + standings
 * - "tt365" fixtures: extracts MatchCard links and queues scrapeUrlTask jobs
 * - "tt365" matchcard: parses match card HTML and upserts fixtures + rubbers
 */
export const processLogTask: Task = async (payload, helpers) => {
    const {
        logId,
        competitionId,
        platformId,
        platformType,
        tt365DataType,
        matchExternalId,
    } = payload as ProcessLogPayload;

    helpers.logger.info(`processLogTask: processing log ${logId} (${platformType})`);

    // 1. Read the raw scrape log
    const log = await db
        .selectFrom('raw_scrape_logs')
        .select(['id', 'raw_payload', 'status', 'endpoint_url'])
        .where('id', '=', logId)
        .executeTakeFirst();

    if (!log) {
        throw new Error(`processLogTask: raw_scrape_logs row not found for id=${logId}`);
    }

    if (log.status === 'processed') {
        helpers.logger.info(`processLogTask: log ${logId} already processed, skipping`);
        return;
    }

    if (platformType === 'ttleagues' || platformType === 'ttleagues-bundle') {
        await processTTLeagues(log, competitionId, platformId, logId, helpers);
    } else {
        const mode = tt365DataType ?? 'standings';

        if (mode === 'fixtures') {
            await processTT365Fixtures(log, competitionId, platformId, logId, helpers);
            return;
        }

        if (mode === 'matchcard') {
            await processTT365MatchCard(
                log,
                competitionId,
                platformId,
                logId,
                matchExternalId,
                helpers,
            );
            return;
        }

        await processTT365Standings(log, competitionId, platformId, logId, helpers);
    }
};

// ─── TT Leagues (JSON API) ───────────────────────────────────────────────────

async function processTTLeagues(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: { logger: { info: (msg: string) => void } },
) {
    const rawJson = JSON.parse(log.raw_payload);

    // The standings API returns a flat array; the full bundle has {standings, matches, sets}
    if (Array.isArray(rawJson)) {
        // Standalone standings response — build a minimal ParsedTTLeaguesData
        const { StandingsResponseSchema } = await import('../zod-schemas.js');
        const standings = StandingsResponseSchema.parse(rawJson);

        const teams = new Map<string, { externalId: string; name: string }>();
        for (const s of standings) {
            const extId = String(s.teamId);
            if (!teams.has(extId)) {
                teams.set(extId, { externalId: extId, name: s.name });
            }
        }

        await loadTTLeaguesData(db, {
            competitionId,
            platformId,
            parsedData: {
                teams: Array.from(teams.values()),
                players: [],
                fixtures: [],
                rubbers: [],
                standings: standings.map((s) => ({
                    teamExternalId: String(s.teamId),
                    position: s.position,
                    played: s.played,
                    won: s.won,
                    drawn: s.drawn,
                    lost: s.lost,
                    points: s.points,
                })),
            },
            scrapeLogIds: [logId],
        });
    } else {
        // Full bundled response with standings + matches + sets
        const parsedData = parseTTLeaguesData({
            standings: rawJson.standings,
            matches: rawJson.matches,
            sets: rawJson.sets ?? {},
        });

        await loadTTLeaguesData(db, {
            competitionId,
            platformId,
            parsedData,
            scrapeLogIds: [logId],
        });

        if (parsedData.players.length > 0) {
            await reconcilePlayersByName(db, helpers.logger);
        }
    }

    helpers.logger.info(`processLogTask: TT Leagues log ${logId} processed successfully`);
}

// ─── TT365 (HTML Cheerio) ────────────────────────────────────────────────────

async function processTT365Standings(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: { logger: { info: (msg: string) => void } },
) {
    // Parse standings HTML
    const { teams, standings } = parseTT365Standings(log.raw_payload);

    if (standings.length === 0) {
        helpers.logger.info(`processLogTask: TT365 log ${logId} has no standings, marking failed`);
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'failed' })
            .where('id', '=', logId)
            .execute();
        return;
    }

    // Load via the same loader by building a compatible ParsedTTLeaguesData
    await loadTTLeaguesData(db, {
        competitionId,
        platformId,
        parsedData: {
            teams: teams.map((t) => ({
                externalId: t.externalId,
                name: t.name,
            })),
            players: [],
            fixtures: [],
            rubbers: [],
            standings: standings.map((s) => ({
                teamExternalId: s.teamExternalId,
                position: s.position,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                points: s.points,
            })),
        },
        scrapeLogIds: [logId],
    });

    helpers.logger.info(
        `processLogTask: TT365 log ${logId} processed (${standings.length} standings)`,
    );
}

async function processTT365Fixtures(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: {
        addJob: (identifier: string, payload: unknown) => Promise<unknown>;
        logger: { info: (msg: string) => void };
    },
) {
    const targets = parseTT365FixtureMatchCards(log.raw_payload, log.endpoint_url);
    const targetExternalIds = targets.map((t) => t.matchExternalId);

    const existingFixtures = targetExternalIds.length
        ? await db
            .selectFrom('fixtures')
            .select(['external_id', 'status', 'updated_at'])
            .where('competition_id', '=', competitionId)
            .where('external_id', 'in', targetExternalIds)
            .execute()
        : [];

    const existingByExternalId = new Map(
        existingFixtures.map((f) => [f.external_id, f]),
    );

    const nowMs = Date.now();
    const shouldRefresh = (externalId: string): boolean => {
        const existing = existingByExternalId.get(externalId);
        if (!existing) return true;

        const updatedAtMs = new Date(existing.updated_at).getTime();
        const ageMs = nowMs - updatedAtMs;

        if (existing.status === 'upcoming') {
            return ageMs >= TT365_RECHECK_UPCOMING_MS;
        }
        if (existing.status === 'postponed') {
            return ageMs >= TT365_RECHECK_POSTPONED_MS;
        }
        // completed
        return ageMs >= TT365_RECHECK_COMPLETED_MS;
    };

    const queueTargets = targets.filter((t) => shouldRefresh(t.matchExternalId));

    helpers.logger.info(
        `processLogTask: TT365 fixtures log ${logId} extracted ${targets.length} match cards, queuing ${queueTargets.length}`,
    );

    for (const target of queueTargets) {
        await helpers.addJob('scrapeUrlTask', {
            url: target.url,
            platformId,
            platformType: 'tt365',
            competitionId,
            tt365DataType: 'matchcard',
            matchExternalId: target.matchExternalId,
        });
    }

    await db
        .updateTable('raw_scrape_logs')
        .set({ status: 'processed' })
        .where('id', '=', logId)
        .execute();
}

function extractMatchIdFromEndpoint(endpointUrl: string): string | null {
    const match = endpointUrl.match(/\/matchcard\/(\d+)(?:[/?#]|$)/i);
    return match?.[1] ?? null;
}

async function processTT365MatchCard(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    payloadMatchExternalId: string | undefined,
    helpers: { logger: { info: (msg: string) => void } },
) {
    const matchExternalId =
        payloadMatchExternalId ?? extractMatchIdFromEndpoint(log.endpoint_url);
    if (!matchExternalId) {
        throw new Error(
            `processLogTask: TT365 match-card log ${logId} missing matchExternalId`,
        );
    }

    const parsed = parseTT365MatchCard(log.raw_payload, matchExternalId);

    if (
        !parsed.fixture.homeTeamExternalId ||
        !parsed.fixture.awayTeamExternalId
    ) {
        helpers.logger.info(
            `processLogTask: TT365 match-card log ${logId} invalid team data, marking failed`,
        );
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'failed' })
            .where('id', '=', logId)
            .execute();
        return;
    }

    await loadTTLeaguesData(db, {
        competitionId,
        platformId,
        parsedData: {
            teams: parsed.teams.map((t) => ({
                externalId: t.externalId,
                name: t.name,
            })),
            players: parsed.players.map((p) => ({
                externalId: p.externalId,
                name: p.name,
            })),
            fixtures: [parsed.fixture],
            rubbers: parsed.rubbers,
            standings: [],
        },
        scrapeLogIds: [logId],
    });

    helpers.logger.info(
        `processLogTask: TT365 match-card log ${logId} processed (${parsed.rubbers.length} rubbers)`,
    );
}
