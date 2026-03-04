/**
 * Bootstrap module: reads leagues.json config, ensures all
 * Platform → League → Season → Competition rows exist in the DB,
 * and returns a flat list of scrape targets for the worker to queue.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config Types ─────────────────────────────────────────────────────────────

interface TT365Division {
    name: string;
    season: string;   // e.g. "Winter_2025"
    slug: string;     // e.g. "Premier_Division"
}

interface TTLeaguesDivision {
    name: string;
    divisionId: number;
}

interface LeagueConfig {
    platform: 'tt365' | 'ttleagues';
    leagueName: string;
    externalId: string;
    seasonName: string;
    seasonExtId: string;
    baseUrl: string;
    divisions: (TT365Division | TTLeaguesDivision)[];
}

// ─── Output: scrape target ────────────────────────────────────────────────────

export interface ScrapeTarget {
    url: string;
    platformId: string;
    platformType: 'tt365' | 'ttleagues';
    competitionId: string;
    divisionExtId: string;   // TT Leagues divisionId or TT365 slug
    divisionName: string;
    leagueName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TT365_BASE = 'https://www.tabletennis365.com';
const TTL_API_BASE = 'https://ttleagues-api.azurewebsites.net/api';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * Reads leagues.json, upserts DB records, and returns scrape targets.
 * This is idempotent — safe to call on every worker startup.
 */
export async function bootstrap(db: Kysely<Database>): Promise<ScrapeTarget[]> {
    const configPath = resolve(__dirname, '../config/leagues.json');
    const leagues: LeagueConfig[] = JSON.parse(readFileSync(configPath, 'utf-8'));

    const targets: ScrapeTarget[] = [];

    for (const league of leagues) {
        // ── 1. Upsert Platform ────────────────────────────────────────────
        const platformName = league.platform === 'tt365' ? 'TableTennis365' : 'TT Leagues';
        const platformBaseUrl = league.platform === 'tt365' ? TT365_BASE : TTL_API_BASE;

        let platformId = await upsertPlatform(db, platformName, platformBaseUrl);

        // ── 2. Upsert League ──────────────────────────────────────────────
        const leagueId = await upsertLeague(db, platformId, league.externalId, league.leagueName);

        // ── 3. Upsert Season ──────────────────────────────────────────────
        const seasonId = await upsertSeason(db, leagueId, league.seasonExtId, league.seasonName);

        // ── 4. Upsert each Division → Competition ────────────────────────
        for (const div of league.divisions) {
            let divExtId: string;
            let scrapeUrl: string;

            if (league.platform === 'tt365') {
                const d = div as TT365Division;
                divExtId = d.slug.toLowerCase();
                scrapeUrl = `${league.baseUrl}/Tables/${d.season}/${d.slug}`;
            } else {
                const d = div as TTLeaguesDivision;
                divExtId = String(d.divisionId);
                scrapeUrl = `${TTL_API_BASE}/divisions/${d.divisionId}/standings`;
            }

            const competitionId = await upsertCompetition(db, seasonId, divExtId, div.name);

            targets.push({
                url: scrapeUrl,
                platformId,
                platformType: league.platform,
                competitionId,
                divisionExtId: divExtId,
                divisionName: div.name,
                leagueName: league.leagueName,
            });
        }
    }

    return targets;
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertPlatform(db: Kysely<Database>, name: string, baseUrl: string): Promise<string> {
    const existing = await db
        .selectFrom('platforms')
        .select('id')
        .where('name', '=', name)
        .executeTakeFirst();
    if (existing) return existing.id;

    const row = await db
        .insertInto('platforms')
        .values({ name, base_url: baseUrl })
        .returning('id')
        .executeTakeFirstOrThrow();
    return row.id;
}

async function upsertLeague(
    db: Kysely<Database>,
    platformId: string,
    externalId: string,
    name: string,
): Promise<string> {
    const existing = await db
        .selectFrom('leagues')
        .select('id')
        .where('external_id', '=', externalId)
        .executeTakeFirst();
    if (existing) return existing.id;

    const row = await db
        .insertInto('leagues')
        .values({ platform_id: platformId, external_id: externalId, name })
        .returning('id')
        .executeTakeFirstOrThrow();
    return row.id;
}

async function upsertSeason(
    db: Kysely<Database>,
    leagueId: string,
    externalId: string,
    name: string,
): Promise<string> {
    const existing = await db
        .selectFrom('seasons')
        .select('id')
        .where('league_id', '=', leagueId)
        .where('external_id', '=', externalId)
        .executeTakeFirst();
    if (existing) return existing.id;

    const row = await db
        .insertInto('seasons')
        .values({ league_id: leagueId, external_id: externalId, name, is_active: true })
        .returning('id')
        .executeTakeFirstOrThrow();
    return row.id;
}

async function upsertCompetition(
    db: Kysely<Database>,
    seasonId: string,
    externalId: string,
    name: string,
): Promise<string> {
    const existing = await db
        .selectFrom('competitions')
        .select('id')
        .where('season_id', '=', seasonId)
        .where('external_id', '=', externalId)
        .executeTakeFirst();
    if (existing) return existing.id;

    const row = await db
        .insertInto('competitions')
        .values({ season_id: seasonId, external_id: externalId, name, type: 'league' })
        .returning('id')
        .executeTakeFirstOrThrow();
    return row.id;
}
