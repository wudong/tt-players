import type { Task } from 'graphile-worker';
import { db } from '@tt-players/db';
import { parseTTLeaguesData } from '../parser.js';
import {
    parseTT365FixtureMatchCards,
    parseTT365MatchCard,
    parseTT365PlayerResultsForMatch,
    parseTT365PlayerStatsTargets,
    parseTT365Standings,
} from '../tt365-parser.js';
import { loadTTLeaguesData } from '../loader.js';
import { reconcilePlayersByName } from '../player-reconciler.js';

const TT365_RECHECK_UPCOMING_MS = 12 * 60 * 60 * 1000; // 12h
const TT365_RECHECK_POSTPONED_MS = 2 * 24 * 60 * 60 * 1000; // 2d
const TT365_RECHECK_COMPLETED_MS = 14 * 24 * 60 * 60 * 1000; // 14d
const TT365_FORCE_FIXTURES_REFRESH = process.env['TT365_FORCE_FIXTURES_REFRESH'] === '1';
const TT365_FORCE_PLAYER_STATS_REFRESH = process.env['TT365_FORCE_PLAYER_STATS_REFRESH'] === '1';
const TT365_PLAYER_STATS_RECHECK_MS = Number(
    process.env['TT365_PLAYER_STATS_RECHECK_MS'] ?? `${12 * 60 * 60 * 1000}`,
);
const SCRAPE_JOB_SPEC = { maxAttempts: 1 };
const TT365_PLAYER_STATS_SCRAPE_JOB_SPEC = { maxAttempts: 1 };

type AddJobSpec = {
    maxAttempts?: number;
    jobKey?: string;
};

export interface ProcessLogPayload {
    logId: string;
    competitionId: string;
    platformId: string;
    platformType: 'tt365' | 'ttleagues' | 'ttleagues-bundle';
    tt365DataType?: 'standings' | 'fixtures' | 'matchcard' | 'playerstats';
    matchExternalId?: string;
    playerExternalId?: string;
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
 * - "tt365" matchcard: parses match card HTML, upserts fixture/rubbers, queues player-stat jobs
 * - "tt365" playerstats: updates singles rubber scores from player results page
 */
export const processLogTask: Task = async (payload, helpers) => {
    const {
        logId,
        competitionId,
        platformId,
        platformType,
        tt365DataType,
        matchExternalId,
        playerExternalId,
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

    let processedSuccessfully = false;

    if (platformType === 'ttleagues' || platformType === 'ttleagues-bundle') {
        processedSuccessfully = await processTTLeagues(
            log,
            competitionId,
            platformId,
            logId,
            helpers,
        );
    } else {
        const mode = tt365DataType ?? 'standings';

        if (mode === 'fixtures') {
            processedSuccessfully = await processTT365Fixtures(
                log,
                competitionId,
                platformId,
                logId,
                helpers,
            );
        } else if (mode === 'matchcard') {
            processedSuccessfully = await processTT365MatchCard(
                log,
                competitionId,
                platformId,
                logId,
                matchExternalId,
                helpers,
            );
        } else if (mode === 'playerstats') {
            processedSuccessfully = await processTT365PlayerStats(
                log,
                competitionId,
                platformId,
                logId,
                matchExternalId,
                playerExternalId,
                helpers,
            );
        } else {
            processedSuccessfully = await processTT365Standings(
                log,
                competitionId,
                platformId,
                logId,
                helpers,
            );
        }
    }

    if (processedSuccessfully) {
        await db
            .updateTable('competitions')
            .set({ last_scraped_at: new Date() })
            .where('id', '=', competitionId)
            .execute();
    }
};

// ─── TT Leagues (JSON API) ───────────────────────────────────────────────────

async function processTTLeagues(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: { logger: { info: (msg: string) => void } },
): Promise<boolean> {
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
    return true;
}

// ─── TT365 (HTML Cheerio) ────────────────────────────────────────────────────

async function processTT365Standings(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: { logger: { info: (msg: string) => void } },
): Promise<boolean> {
    // Parse standings HTML
    const { teams, standings } = parseTT365Standings(log.raw_payload);

    if (standings.length === 0) {
        helpers.logger.info(`processLogTask: TT365 log ${logId} has no standings, marking failed`);
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'failed' })
            .where('id', '=', logId)
            .execute();
        return false;
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
    return true;
}

async function processTT365Fixtures(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    helpers: {
        addJob: (
            identifier: string,
            payload: unknown,
            spec?: AddJobSpec,
        ) => Promise<unknown>;
        logger: { info: (msg: string) => void };
    },
): Promise<boolean> {
    const targets = parseTT365FixtureMatchCards(log.raw_payload, log.endpoint_url);
    const targetExternalIds = targets.map((t) => t.matchExternalId);
    const season = await db
        .selectFrom('competitions as c')
        .innerJoin('seasons as s', 's.id', 'c.season_id')
        .select(['s.is_active'])
        .where('c.id', '=', competitionId)
        .executeTakeFirst();
    const isActiveSeason = season?.is_active === true;

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
        if (TT365_FORCE_FIXTURES_REFRESH) return true;

        const existing = existingByExternalId.get(externalId);
        if (!existing) return true;

        // Historical seasons are one-off snapshots unless manually forced.
        if (!isActiveSeason) return false;

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
        }, SCRAPE_JOB_SPEC);
    }

    await db
        .updateTable('raw_scrape_logs')
        .set({ status: 'processed' })
        .where('id', '=', logId)
        .execute();

    return true;
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
    helpers: {
        addJob: (
            identifier: string,
            payload: unknown,
            spec?: AddJobSpec,
        ) => Promise<unknown>;
        logger: { info: (msg: string) => void };
    },
): Promise<boolean> {
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
        return false;
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

    // Queue player statistics scrapes as the source-of-truth for singles scores.
    const playerStatsTargets = parseTT365PlayerStatsTargets(
        log.raw_payload,
        log.endpoint_url,
    );

    const season = await db
        .selectFrom('competitions as c')
        .innerJoin('seasons as s', 's.id', 'c.season_id')
        .select(['s.is_active'])
        .where('c.id', '=', competitionId)
        .executeTakeFirst();
    const isActiveSeason = season?.is_active === true;

    const existingPlayerStatLogs = playerStatsTargets.length > 0
        ? await db
            .selectFrom('raw_scrape_logs')
            .select(({ fn, ref }) => [
                'endpoint_url',
                fn.max(ref('scraped_at')).as('last_scraped_at'),
            ])
            .where('status', '=', 'processed')
            .where(
                'endpoint_url',
                'in',
                playerStatsTargets.map((target) => target.url),
            )
            .groupBy('endpoint_url')
            .execute()
        : [];

    const existingByUrl = new Map(
        existingPlayerStatLogs.map((row) => [row.endpoint_url, row.last_scraped_at]),
    );

    const nowMs = Date.now();
    const queuePlayerStatsTargets = playerStatsTargets.filter((target) => {
        if (TT365_FORCE_PLAYER_STATS_REFRESH) return true;

        const lastScrapedAt = existingByUrl.get(target.url);
        if (!lastScrapedAt) return true;

        // Historical seasons are one-off snapshots unless explicitly forced.
        if (!isActiveSeason) return false;

        const ageMs = nowMs - new Date(lastScrapedAt).getTime();
        return ageMs >= TT365_PLAYER_STATS_RECHECK_MS;
    });

    for (const target of queuePlayerStatsTargets) {
        await helpers.addJob('scrapeUrlTask', {
            url: target.url,
            platformId,
            platformType: 'tt365',
            competitionId,
            tt365DataType: 'playerstats',
            matchExternalId,
            playerExternalId: target.playerExternalId,
        }, {
            ...TT365_PLAYER_STATS_SCRAPE_JOB_SPEC,
            jobKey: `tt365-playerstats:${competitionId}:${target.seasonToken}:${target.playerExternalId}`,
        });
    }

    helpers.logger.info(
        `processLogTask: TT365 match-card log ${logId} processed (${parsed.rubbers.length} rubbers, queued ${queuePlayerStatsTargets.length} player stats pages)`,
    );
    return true;
}

function extractPlayerIdFromPlayerStatsUrl(endpointUrl: string): string | null {
    const match = endpointUrl.match(/\/results\/player\/statistics\/[^/]+\/[^/]+\/(\d+)(?:[/?#]|$)/i);
    return match?.[1] ?? null;
}

async function processTT365PlayerStats(
    log: { id: string; raw_payload: string; endpoint_url: string },
    competitionId: string,
    platformId: string,
    logId: string,
    payloadMatchExternalId: string | undefined,
    payloadPlayerExternalId: string | undefined,
    helpers: { logger: { info: (msg: string) => void } },
): Promise<boolean> {
    const matchExternalId =
        payloadMatchExternalId ?? extractMatchIdFromEndpoint(log.endpoint_url);
    if (!matchExternalId) {
        throw new Error(
            `processLogTask: TT365 player-stats log ${logId} missing matchExternalId`,
        );
    }

    const playerExternalId =
        payloadPlayerExternalId ?? extractPlayerIdFromPlayerStatsUrl(log.endpoint_url);
    if (!playerExternalId) {
        throw new Error(
            `processLogTask: TT365 player-stats log ${logId} missing playerExternalId`,
        );
    }

    const fixture = await db
        .selectFrom('fixtures')
        .select(['id'])
        .where('competition_id', '=', competitionId)
        .where('external_id', '=', matchExternalId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

    if (!fixture) {
        helpers.logger.info(
            `processLogTask: TT365 player-stats log ${logId} fixture ${matchExternalId} missing, marking failed`,
        );
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'failed' })
            .where('id', '=', logId)
            .execute();
        return false;
    }

    const observations = parseTT365PlayerResultsForMatch(log.raw_payload, matchExternalId);
    if (observations.length === 0) {
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'processed' })
            .where('id', '=', logId)
            .execute();
        helpers.logger.info(
            `processLogTask: TT365 player-stats log ${logId} has no rows for match ${matchExternalId}, marked processed`,
        );
        return true;
    }

    const externalIds = Array.from(
        new Set([playerExternalId, ...observations.map((row) => row.opponentExternalId)]),
    );

    const players = await db
        .selectFrom('external_players')
        .select(['id', 'external_id', 'canonical_player_id'])
        .where('platform_id', '=', platformId)
        .where('deleted_at', 'is', null)
        .where('external_id', 'in', externalIds)
        .execute();

    const playerIdByExternal = new Map(
        players
            .filter((p) => p.external_id !== null)
            .map((p) => [p.external_id as string, p.canonical_player_id ?? p.id]),
    );

    const fixtureRubbers = await db
        .selectFrom('rubbers')
        .select([
            'id',
            'home_player_1_id',
            'away_player_1_id',
            'home_games_won',
            'away_games_won',
        ])
        .where('fixture_id', '=', fixture.id)
        .where('is_doubles', '=', false)
        .where('deleted_at', 'is', null)
        .execute();

    const scraperPlayerId = playerIdByExternal.get(playerExternalId);
    if (!scraperPlayerId) {
        await db
            .updateTable('raw_scrape_logs')
            .set({ status: 'processed' })
            .where('id', '=', logId)
            .execute();
        helpers.logger.info(
            `processLogTask: TT365 player-stats log ${logId} player ${playerExternalId} not found in external_players`,
        );
        return true;
    }

    let updates = 0;
    const usedRubberIds = new Set<string>();
    for (const row of observations) {
        const opponentId = playerIdByExternal.get(row.opponentExternalId);
        if (!opponentId) continue;

        const matchingRubber = fixtureRubbers.find((rubber) => {
            if (usedRubberIds.has(rubber.id)) return false;
            return (
                (rubber.home_player_1_id === scraperPlayerId && rubber.away_player_1_id === opponentId) ||
                (rubber.home_player_1_id === opponentId && rubber.away_player_1_id === scraperPlayerId)
            );
        });
        if (!matchingRubber) continue;

        usedRubberIds.add(matchingRubber.id);
        const playerIsHome = matchingRubber.home_player_1_id === scraperPlayerId;
        const homeGamesWon = playerIsHome ? row.playerGamesWon : row.opponentGamesWon;
        const awayGamesWon = playerIsHome ? row.opponentGamesWon : row.playerGamesWon;

        if (
            matchingRubber.home_games_won === homeGamesWon &&
            matchingRubber.away_games_won === awayGamesWon
        ) {
            continue;
        }

        await db
            .updateTable('rubbers')
            .set({
                home_games_won: homeGamesWon,
                away_games_won: awayGamesWon,
                updated_at: new Date(),
            })
            .where('id', '=', matchingRubber.id)
            .execute();
        updates += 1;
    }

    await db
        .updateTable('raw_scrape_logs')
        .set({ status: 'processed' })
        .where('id', '=', logId)
        .execute();

    helpers.logger.info(
        `processLogTask: TT365 player-stats log ${logId} applied ${updates} score updates for match ${matchExternalId}`,
    );
    return true;
}
