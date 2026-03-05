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

describe('GET /api/players/:id/stats/extended and /api/players/:id/h2h/:opponentId', () => {
    it('returns nemesis_id for players with at least one loss', async () => {
        const res = await request
            .get(`/api/players/${ids.awayPlayerId}/stats/extended`)
            .expect(200);

        expect(res.body.nemesis_id).toBe(ids.homePlayerId);
        expect(typeof res.body.nemesis).toBe('string');
    });

    it('returns h2h encounter league labels as "League · Division"', async () => {
        const res = await request
            .get(`/api/players/${ids.homePlayerId}/h2h/${ids.awayPlayerId}`)
            .expect(200);

        expect(res.body.encounters.length).toBeGreaterThan(0);
        expect(res.body.encounters[0].league).toBe('Test League · Division 1');
    });
});
