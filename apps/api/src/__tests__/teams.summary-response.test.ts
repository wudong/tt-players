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

describe('GET /api/teams/:id/summary', () => {
    it('returns team labels for league, division, and season', async () => {
        const res = await request
            .get(`/api/teams/${ids.homeTeamId}/summary`)
            .expect(200);

        expect(res.body).toMatchObject({
            id: ids.homeTeamId,
            name: 'Home FC',
            league_id: ids.leagueId,
            league_name: 'Test League',
            season_id: ids.seasonId,
            season_name: '2024/25',
            competition_id: ids.competitionId,
            competition_name: 'Division 1',
        });
    });

    it('returns 404 when the team does not exist', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000099';
        const res = await request
            .get(`/api/teams/${fakeId}/summary`)
            .expect(404);

        expect(res.body).toMatchObject({
            error: expect.any(String),
            statusCode: 404,
        });
    });
});
