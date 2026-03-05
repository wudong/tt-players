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

describe('GET /api/teams/:id/fixtures - enriched team labels and score', () => {
    it('returns team names and aggregate match score in fixture rows', async () => {
        const res = await request
            .get(`/api/teams/${ids.homeTeamId}/fixtures`)
            .expect(200);

        expect(res.body.data).toHaveLength(1);
        const fixture = res.body.data[0];

        expect(fixture.home_team_name).toBe('Home FC');
        expect(fixture.away_team_name).toBe('Away FC');
        expect(fixture.home_score).toBe(1);
        expect(fixture.away_score).toBe(0);
    });
});
