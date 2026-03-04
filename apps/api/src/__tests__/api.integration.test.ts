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

// ─── /competitions/:id/standings ──────────────────────────────────────────────

describe('GET /competitions/:id/standings', () => {
    it('returns 200 with sorted standings array', async () => {
        const res = await request
            .get(`/competitions/${ids.competitionId}/standings`)
            .expect(200);

        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);

        const item = res.body.data[0];
        expect(item).toMatchObject({
            position: expect.any(Number),
            team_id: expect.stringMatching(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            ),
            team_name: expect.any(String),
            played: expect.any(Number),
            won: expect.any(Number),
            drawn: expect.any(Number),
            lost: expect.any(Number),
            points: expect.any(Number),
        });
    });

    it('returns standings ordered by position ascending', async () => {
        const res = await request
            .get(`/competitions/${ids.competitionId}/standings`)
            .expect(200);

        const positions: number[] = res.body.data.map((d: { position: number }) => d.position);
        const sorted = [...positions].sort((a, b) => a - b);
        expect(positions).toEqual(sorted);
    });

    it('returns correct data for the seeded standing', async () => {
        const res = await request
            .get(`/competitions/${ids.competitionId}/standings`)
            .expect(200);

        const item = res.body.data[0];
        expect(item.team_id).toBe(ids.homeTeamId);
        expect(item.team_name).toBe('Home FC');
        expect(item.position).toBe(1);
        expect(item.played).toBe(5);
        expect(item.won).toBe(4);
        expect(item.points).toBe(12);
    });

    it('returns 404 with error shape for unknown competition', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000001';
        const res = await request
            .get(`/competitions/${fakeId}/standings`)
            .expect(404);

        expect(res.body).toMatchObject({
            error: expect.any(String),
            statusCode: 404,
        });
    });

    it('includes CORS header for the configured origin', async () => {
        const res = await request
            .get(`/competitions/${ids.competitionId}/standings`)
            .set('Origin', 'http://localhost:7373')
            .expect(200);

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:7373');
    });
});

// ─── /teams/:id/fixtures ──────────────────────────────────────────────────────

describe('GET /teams/:id/fixtures', () => {
    it('returns 200 with pagination shape for home team', async () => {
        const res = await request
            .get(`/teams/${ids.homeTeamId}/fixtures`)
            .expect(200);

        expect(res.body).toMatchObject({
            total: expect.any(Number),
            limit: expect.any(Number),
            offset: expect.any(Number),
            data: expect.any(Array),
        });
        expect(res.body.total).toBeGreaterThanOrEqual(1);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('fixture item has correct schema', async () => {
        const res = await request
            .get(`/teams/${ids.homeTeamId}/fixtures`)
            .expect(200);

        const item = res.body.data[0];
        expect(item).toMatchObject({
            id: expect.stringMatching(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            ),
            competition_id: ids.competitionId,
            home_team_id: ids.homeTeamId,
            away_team_id: ids.awayTeamId,
            status: 'completed',
            date_played: expect.any(String),
        });
    });

    it('returns fixtures for away team as well', async () => {
        const res = await request
            .get(`/teams/${ids.awayTeamId}/fixtures`)
            .expect(200);

        expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('respects limit=1 pagination', async () => {
        const res = await request
            .get(`/teams/${ids.homeTeamId}/fixtures?limit=1&offset=0`)
            .expect(200);

        expect(res.body.limit).toBe(1);
        expect(res.body.offset).toBe(0);
        expect(res.body.data.length).toBe(1);
    });

    it('returns empty data array when offset exceeds total', async () => {
        const res = await request
            .get(`/teams/${ids.homeTeamId}/fixtures?limit=20&offset=999`)
            .expect(200);

        expect(res.body.data).toHaveLength(0);
        // total should still reflect the real count
        expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('returns 404 with error shape for unknown team', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000002';
        const res = await request
            .get(`/teams/${fakeId}/fixtures`)
            .expect(404);

        expect(res.body).toMatchObject({
            error: expect.any(String),
            statusCode: 404,
        });
    });

    it('includes CORS header', async () => {
        const res = await request
            .get(`/teams/${ids.homeTeamId}/fixtures`)
            .set('Origin', 'http://localhost:7373')
            .expect(200);

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:7373');
    });
});

// ─── /players/:id/stats ───────────────────────────────────────────────────────

describe('GET /players/:id/stats', () => {
    it('returns 200 with correct stats shape for home player', async () => {
        const res = await request
            .get(`/players/${ids.homePlayerId}/stats`)
            .expect(200);

        expect(res.body).toMatchObject({
            player_id: ids.homePlayerId,
            player_name: 'Alice Smith',
            wins: expect.any(Number),
            losses: expect.any(Number),
            total: expect.any(Number),
        });
    });

    it('wins + losses === total', async () => {
        const res = await request
            .get(`/players/${ids.homePlayerId}/stats`)
            .expect(200);

        expect(res.body.wins + res.body.losses).toBe(res.body.total);
    });

    it('excludes walkover rubbers from total count', async () => {
        // Seeded: 1 normal rubber + 1 walkover rubber. Total should be 1 (only normal counted).
        const res = await request
            .get(`/players/${ids.homePlayerId}/stats`)
            .expect(200);

        expect(res.body.total).toBe(1);
    });

    it('correctly counts wins for home player (home_games_won=3 > away_games_won=1)', async () => {
        const res = await request
            .get(`/players/${ids.homePlayerId}/stats`)
            .expect(200);

        expect(res.body.wins).toBe(1);
        expect(res.body.losses).toBe(0);
    });

    it('correctly counts losses for away player (away_games_won=1 < home_games_won=3)', async () => {
        const res = await request
            .get(`/players/${ids.awayPlayerId}/stats`)
            .expect(200);

        expect(res.body.wins).toBe(0);
        expect(res.body.losses).toBe(1);
        expect(res.body.total).toBe(1);
    });

    it('returns 404 with error shape for unknown player', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000003';
        const res = await request
            .get(`/players/${fakeId}/stats`)
            .expect(404);

        expect(res.body).toMatchObject({
            error: expect.any(String),
            statusCode: 404,
        });
    });

    it('includes CORS header', async () => {
        const res = await request
            .get(`/players/${ids.homePlayerId}/stats`)
            .set('Origin', 'http://localhost:7373')
            .expect(200);

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:7373');
    });
});
