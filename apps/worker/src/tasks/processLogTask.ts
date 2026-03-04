import type { Task } from 'graphile-worker';
import { db } from '@tt-players/db';
import { parseTTLeaguesData } from '../parser.js';
import { parseTT365Standings } from '../tt365-parser.js';
import { loadTTLeaguesData } from '../loader.js';

export interface ProcessLogPayload {
    logId: string;
    competitionId: string;
    platformId: string;
    platformType: 'tt365' | 'ttleagues' | 'ttleagues-bundle';
}

/**
 * Graphile Worker task: Phase 2 (Transform + Load).
 *
 * Reads raw_payload from raw_scrape_logs and processes it based
 * on the platform type:
 * - "ttleagues": standalone standings JSON array
 * - "ttleagues-bundle": bundled {standings, matches, sets} from scrapeMatchesTask
 * - "tt365": parses HTML standings with Cheerio, upserts teams + standings
 */
export const processLogTask: Task = async (payload, helpers) => {
    const { logId, competitionId, platformId, platformType } = payload as ProcessLogPayload;

    helpers.logger.info(`processLogTask: processing log ${logId} (${platformType})`);

    // 1. Read the raw scrape log
    const log = await db
        .selectFrom('raw_scrape_logs')
        .select(['id', 'raw_payload', 'status'])
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
        await processTT365(log, competitionId, platformId, logId, helpers);
    }
};

// ─── TT Leagues (JSON API) ───────────────────────────────────────────────────

async function processTTLeagues(
    log: { id: string; raw_payload: string },
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
    }

    helpers.logger.info(`processLogTask: TT Leagues log ${logId} processed successfully`);
}

// ─── TT365 (HTML Cheerio) ────────────────────────────────────────────────────

async function processTT365(
    log: { id: string; raw_payload: string },
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
