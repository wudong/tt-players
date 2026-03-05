import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import type { MigrationProvider, Migration } from 'kysely';
import pg from 'pg';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

import * as m001 from '@tt-players/db/src/migrations/001_create_enums.js';
import * as m002 from '@tt-players/db/src/migrations/002_create_core_tables.js';
import * as m003 from '@tt-players/db/src/migrations/003_create_match_tables.js';
import * as m004 from '@tt-players/db/src/migrations/004_create_raw_scrape_logs.js';
import * as m005 from '@tt-players/db/src/migrations/005_make_rubber_players_nullable.js';
import * as m006 from '@tt-players/db/src/migrations/006_add_canonical_player_id_to_external_players.js';

import type { Database } from '@tt-players/db';
import type { ProcessLogPayload } from '../tasks/processLogTask.js';

const { Pool } = pg;

const TEST_DB_NAME = 'tt_tt365_process_log_test';
const ADMIN_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
const TEST_DATABASE_URL = `postgres://postgres:postgres@localhost:5432/${TEST_DB_NAME}`;

class StaticMigrationProvider implements MigrationProvider {
    async getMigrations(): Promise<Record<string, Migration>> {
        return {
            '001_create_enums': m001,
            '002_create_core_tables': m002,
            '003_create_match_tables': m003,
            '004_create_raw_scrape_logs': m004,
            '005_make_rubber_players_nullable': m005,
            '006_add_canonical_player_id_to_external_players': m006,
        };
    }
}

let testDb: Kysely<Database>;
let platformId: string;
let competitionId: string;
let processLogTask: any;
let appDb: Kysely<Database> | null = null;

const fixturesHtml = readFileSync(
    join(import.meta.dirname, 'fixtures', 'tt365_fixtures.html'),
    'utf-8',
);
const matchCardHtml = readFileSync(
    join(import.meta.dirname, 'fixtures', 'tt365_matchcard.html'),
    'utf-8',
);

async function createTestDatabase(): Promise<void> {
    const adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL });
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    await adminPool.end();
}

async function dropTestDatabase(): Promise<void> {
    if (testDb) {
        await testDb.destroy();
    }
    const adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL });
    await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${TEST_DB_NAME}'
          AND pid <> pg_backend_pid()
    `);
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    await adminPool.end();
}

function createTestDb(): Kysely<Database> {
    return new Kysely<Database>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString: TEST_DATABASE_URL }),
        }),
    });
}

async function runMigrations(db: Kysely<Database>): Promise<void> {
    const migrator = new Migrator({
        db,
        provider: new StaticMigrationProvider(),
    });
    const { error } = await migrator.migrateToLatest();
    if (error) throw error;
}

describe('processLogTask TT365 modes', () => {
    beforeAll(async () => {
        await createTestDatabase();
        testDb = createTestDb();
        await runMigrations(testDb);

        const platform = await testDb
            .insertInto('platforms')
            .values({
                name: 'TableTennis365',
                base_url: 'https://www.tabletennis365.com',
            })
            .returning('id')
            .executeTakeFirstOrThrow();
        platformId = platform.id;

        const league = await testDb
            .insertInto('leagues')
            .values({
                platform_id: platformId,
                external_id: 'brentwood-tt365',
                name: 'Brentwood & District TTL',
            })
            .returning('id')
            .executeTakeFirstOrThrow();

        const season = await testDb
            .insertInto('seasons')
            .values({
                league_id: league.id,
                external_id: 'winter-2025',
                name: 'Winter 2025',
            })
            .returning('id')
            .executeTakeFirstOrThrow();

        const competition = await testDb
            .insertInto('competitions')
            .values({
                season_id: season.id,
                external_id: 'premier_division',
                name: 'Premier Division',
                type: 'league',
            })
            .returning('id')
            .executeTakeFirstOrThrow();
        competitionId = competition.id;

        process.env['DATABASE_URL'] = TEST_DATABASE_URL;
        ({ processLogTask } = await import('../tasks/processLogTask.js'));
        ({ db: appDb } = await import('@tt-players/db'));
    }, 30_000);

    afterAll(async () => {
        if (appDb) {
            await appDb.destroy();
            appDb = null;
        }
        await dropTestDatabase();
    }, 15_000);

    beforeEach(async () => {
        await testDb.deleteFrom('rubbers').execute();
        await testDb.deleteFrom('league_standings').execute();
        await testDb.deleteFrom('fixtures').execute();
        await testDb.deleteFrom('external_players').execute();
        await testDb.deleteFrom('teams').execute();
        await testDb.deleteFrom('raw_scrape_logs').execute();
    });

    it('queues unique TT365 match-card scrape jobs from a fixtures page', async () => {
        const fixturesUrl =
            'https://www.tabletennis365.com/Brentwood/Fixtures/Winter_2025/Premier_Division';
        const [log] = await testDb
            .insertInto('raw_scrape_logs')
            .values({
                platform_id: platformId,
                endpoint_url: fixturesUrl,
                raw_payload: fixturesHtml,
                payload_hash: createHash('sha256').update(fixturesHtml).digest('hex'),
                status: 'pending',
            })
            .returning('id')
            .execute();

        const addJob = vi.fn(async () => undefined);
        const payload: ProcessLogPayload = {
            logId: log.id,
            competitionId,
            platformId,
            platformType: 'tt365',
            tt365DataType: 'fixtures',
        };

        await processLogTask(payload, {
            addJob,
            logger: { info: () => undefined },
        });

        expect(addJob).toHaveBeenCalledTimes(2);
        expect(addJob).toHaveBeenNthCalledWith(
            1,
            'scrapeUrlTask',
            expect.objectContaining({
                competitionId,
                platformId,
                platformType: 'tt365',
                tt365DataType: 'matchcard',
                matchExternalId: '448193',
            }),
        );
        expect(addJob).toHaveBeenNthCalledWith(
            2,
            'scrapeUrlTask',
            expect.objectContaining({
                competitionId,
                platformId,
                platformType: 'tt365',
                tt365DataType: 'matchcard',
                matchExternalId: '448195',
            }),
        );

        const updated = await testDb
            .selectFrom('raw_scrape_logs')
            .select(['status'])
            .where('id', '=', log.id)
            .executeTakeFirstOrThrow();
        expect(updated.status).toBe('processed');
    });

    it('skips queueing fresh completed fixtures that already exist', async () => {
        const fixturesUrl =
            'https://www.tabletennis365.com/Brentwood/Fixtures/Winter_2025/Premier_Division';

        // Existing completed fixture for 448193 should be treated as fresh and skipped.
        await testDb
            .insertInto('fixtures')
            .values({
                competition_id: competitionId,
                external_id: '448193',
                status: 'completed',
                updated_at: new Date(),
            })
            .executeTakeFirstOrThrow();

        const [log] = await testDb
            .insertInto('raw_scrape_logs')
            .values({
                platform_id: platformId,
                endpoint_url: fixturesUrl,
                raw_payload: fixturesHtml,
                payload_hash: createHash('sha256').update(fixturesHtml).digest('hex'),
                status: 'pending',
            })
            .returning('id')
            .execute();

        const addJob = vi.fn(async () => undefined);
        const payload: ProcessLogPayload = {
            logId: log.id,
            competitionId,
            platformId,
            platformType: 'tt365',
            tt365DataType: 'fixtures',
        };

        await processLogTask(payload, {
            addJob,
            logger: { info: () => undefined },
        });

        // 448193 skipped as fresh, 448195 queued.
        expect(addJob).toHaveBeenCalledTimes(1);
        expect(addJob).toHaveBeenCalledWith(
            'scrapeUrlTask',
            expect.objectContaining({
                tt365DataType: 'matchcard',
                matchExternalId: '448195',
            }),
        );
    });

    it('loads TT365 match-card data into fixtures, rubbers, players and teams', async () => {
        const matchCardUrl =
            'https://www.tabletennis365.com/Brentwood/Results/Winter_2025/Premier_Division/MatchCard/458829';
        const [log] = await testDb
            .insertInto('raw_scrape_logs')
            .values({
                platform_id: platformId,
                endpoint_url: matchCardUrl,
                raw_payload: matchCardHtml,
                payload_hash: createHash('sha256').update(matchCardHtml).digest('hex'),
                status: 'pending',
            })
            .returning('id')
            .execute();

        const payload: ProcessLogPayload = {
            logId: log.id,
            competitionId,
            platformId,
            platformType: 'tt365',
            tt365DataType: 'matchcard',
            matchExternalId: '458829',
        };

        await processLogTask(payload, {
            addJob: async () => undefined,
            logger: { info: () => undefined },
        });

        const fixtures = await testDb.selectFrom('fixtures').selectAll().execute();
        expect(fixtures).toHaveLength(1);
        expect(fixtures[0].external_id).toBe('458829');
        expect(fixtures[0].status).toBe('completed');

        const rubbers = await testDb.selectFrom('rubbers').selectAll().execute();
        expect(rubbers).toHaveLength(10);

        const players = await testDb.selectFrom('external_players').selectAll().execute();
        expect(players).toHaveLength(5);

        const teams = await testDb.selectFrom('teams').selectAll().execute();
        expect(teams).toHaveLength(2);

        const updated = await testDb
            .selectFrom('raw_scrape_logs')
            .select(['status'])
            .where('id', '=', log.id)
            .executeTakeFirstOrThrow();
        expect(updated.status).toBe('processed');
    });
});
