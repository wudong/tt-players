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

describe('GET /api/players/leaders', () => {
    it('enforces minimum 10-slot response window for Best Win mode when available rows exceed requested limit', async () => {
        const res = await request
            .get('/api/players/leaders?mode=win_pct&limit=1&min_played=1')
            .expect(200);

        expect(res.body.mode).toBe('win_pct');
        // Seed contains two qualifying players; win_pct mode should not truncate to limit=1.
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0].player_id).toBe(ids.homePlayerId);
        expect(res.body.data[1].player_id).toBe(ids.awayPlayerId);
    });
});
