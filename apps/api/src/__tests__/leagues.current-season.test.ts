import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';
import { buildApp } from '../app.js';
import {
    createTestDatabase,
    createTestKysely,
    dropTestDatabase,
    runMigrations,
    seedTestData,
    type SeedIds,
} from './helpers/seed.js';

let db: Kysely<Database>;
let request: ReturnType<typeof supertest>;
let ids: SeedIds;

beforeAll(async () => {
    await createTestDatabase();
    db = createTestKysely();
    await runMigrations(db);
    ids = await seedTestData(db);

    const app = await buildApp(db);
    await app.ready();
    request = supertest(app.server);
}, 30_000);

afterAll(async () => {
    await dropTestDatabase(db);
}, 15_000);

describe('GET /api/leagues current-season filter', () => {
    it('returns only active-season competitions for each league', async () => {
        const [inactiveSeason] = await db
            .insertInto('seasons')
            .values({
                league_id: ids.leagueId,
                external_id: 'ext-season-old',
                name: '2023/24',
                is_active: false,
            })
            .returning('id')
            .execute();

        await db
            .insertInto('competitions')
            .values({
                season_id: inactiveSeason.id,
                external_id: 'ext-comp-old',
                name: 'Old Division',
                type: 'league',
            })
            .execute();

        const res = await request.get('/api/leagues').expect(200);

        const league = res.body.data.find((row: { id: string }) => row.id === ids.leagueId);
        expect(league).toBeDefined();
        expect(league.season).toBe('2024/25');
        expect(league.divisions.map((d: { name: string }) => d.name)).not.toContain('Old Division');
    });
});
