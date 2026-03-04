/**
 * Seed script for E2E testing.
 *
 * Populates the main tt_players database with a realistic dataset that
 * exercises every API endpoint and every web UI view.
 *
 * Usage:  pnpm db:seed
 */
import 'dotenv/config';
import { db } from './database.js';

async function seed() {
    console.log('🌱 Seeding database…');

    // ── Platform ─────────────────────────────────────────────────────────────
    const [platform] = await db
        .insertInto('platforms')
        .values({ name: 'TT Leagues', base_url: 'https://www.ttleagues.com' })
        .onConflict((oc) => oc.doNothing())
        .returning('id')
        .execute();

    // If the row already existed, query it
    const platformId =
        platform?.id ??
        (
            await db
                .selectFrom('platforms')
                .select('id')
                .where('name', '=', 'TT Leagues')
                .executeTakeFirstOrThrow()
        ).id;

    // ── League ────────────────────────────────────────────────────────────────
    const [league] = await db
        .insertInto('leagues')
        .values({
            platform_id: platformId,
            external_id: 'brentwood-ttl',
            name: 'Brentwood & District TTL',
        })
        .onConflict((oc) => oc.doNothing())
        .returning('id')
        .execute();

    const leagueId =
        league?.id ??
        (
            await db
                .selectFrom('leagues')
                .select('id')
                .where('external_id', '=', 'brentwood-ttl')
                .executeTakeFirstOrThrow()
        ).id;

    // ── Season ────────────────────────────────────────────────────────────────
    const [season] = await db
        .insertInto('seasons')
        .values({
            league_id: leagueId,
            external_id: '2024-25',
            name: '2024/25',
            is_active: true,
        })
        .onConflict((oc) => oc.doNothing())
        .returning('id')
        .execute();

    const seasonId =
        season?.id ??
        (
            await db
                .selectFrom('seasons')
                .select('id')
                .where('external_id', '=', '2024-25')
                .executeTakeFirstOrThrow()
        ).id;

    // ── Competition ───────────────────────────────────────────────────────────
    const [competition] = await db
        .insertInto('competitions')
        .values({
            season_id: seasonId,
            external_id: 'prem-div',
            name: 'Premier Division',
            type: 'league',
        })
        .onConflict((oc) => oc.doNothing())
        .returning('id')
        .execute();

    const competitionId =
        competition?.id ??
        (
            await db
                .selectFrom('competitions')
                .select('id')
                .where('external_id', '=', 'prem-div')
                .executeTakeFirstOrThrow()
        ).id;

    console.log(`  🏆 Competition ID: ${competitionId}`);

    // ── Teams ─────────────────────────────────────────────────────────────────
    const teamData = [
        { name: 'Brentwood A', external_id: 'brentwood-a' },
        { name: 'Hutton A', external_id: 'hutton-a' },
        { name: 'Shenfield A', external_id: 'shenfield-a' },
        { name: 'Chelmsford A', external_id: 'chelmsford-a' },
    ];

    const teamIds: Record<string, string> = {};
    for (const t of teamData) {
        const [row] = await db
            .insertInto('teams')
            .values({ ...t, competition_id: competitionId })
            .onConflict((oc) => oc.doNothing())
            .returning(['id', 'external_id'])
            .execute();

        teamIds[t.external_id] =
            row?.id ??
            (
                await db
                    .selectFrom('teams')
                    .select('id')
                    .where('external_id', '=', t.external_id)
                    .where('competition_id', '=', competitionId)
                    .executeTakeFirstOrThrow()
            ).id;
    }

    // ── External Players ──────────────────────────────────────────────────────
    const playerData = [
        { name: 'Alice Johnson', external_id: 'alice-j' },
        { name: 'Bob Smith', external_id: 'bob-s' },
        { name: 'Charlie Brown', external_id: 'charlie-b' },
        { name: 'Diana Prince', external_id: 'diana-p' },
        { name: 'Edward Norton', external_id: 'edward-n' },
        { name: 'Fiona Apple', external_id: 'fiona-a' },
        { name: 'George Lucas', external_id: 'george-l' },
        { name: 'Helen Troy', external_id: 'helen-t' },
    ];

    const playerIds: Record<string, string> = {};
    for (const p of playerData) {
        const [row] = await db
            .insertInto('external_players')
            .values({ ...p, platform_id: platformId, updated_at: new Date() })
            .onConflict((oc) => oc.doNothing())
            .returning(['id', 'external_id'])
            .execute();

        playerIds[p.external_id] =
            row?.id ??
            (
                await db
                    .selectFrom('external_players')
                    .select('id')
                    .where('external_id', '=', p.external_id)
                    .where('platform_id', '=', platformId)
                    .executeTakeFirstOrThrow()
            ).id;
    }

    // ── League Standings ──────────────────────────────────────────────────────
    const standings = [
        { team_ext: 'brentwood-a', position: 1, played: 12, won: 10, drawn: 1, lost: 1, points: 31 },
        { team_ext: 'hutton-a', position: 2, played: 12, won: 8, drawn: 2, lost: 2, points: 26 },
        { team_ext: 'shenfield-a', position: 3, played: 12, won: 6, drawn: 1, lost: 5, points: 19 },
        { team_ext: 'chelmsford-a', position: 4, played: 12, won: 2, drawn: 0, lost: 10, points: 6 },
    ];

    for (const s of standings) {
        await db
            .insertInto('league_standings')
            .values({
                competition_id: competitionId,
                team_id: teamIds[s.team_ext]!,
                position: s.position,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                points: s.points,
                updated_at: new Date(),
            })
            .onConflict((oc) => oc.doNothing())
            .execute();
    }

    // ── Fixtures ──────────────────────────────────────────────────────────────
    const fixtures = [
        {
            ext: 'fix-1',
            home: 'brentwood-a',
            away: 'hutton-a',
            date: '2025-01-10',
            round: 'Week 1',
            roundOrder: 1,
        },
        {
            ext: 'fix-2',
            home: 'shenfield-a',
            away: 'chelmsford-a',
            date: '2025-01-10',
            round: 'Week 1',
            roundOrder: 1,
        },
        {
            ext: 'fix-3',
            home: 'hutton-a',
            away: 'shenfield-a',
            date: '2025-01-17',
            round: 'Week 2',
            roundOrder: 2,
        },
        {
            ext: 'fix-4',
            home: 'chelmsford-a',
            away: 'brentwood-a',
            date: '2025-01-17',
            round: 'Week 2',
            roundOrder: 2,
        },
    ];

    const fixtureIds: Record<string, string> = {};
    for (const f of fixtures) {
        const [row] = await db
            .insertInto('fixtures')
            .values({
                competition_id: competitionId,
                external_id: f.ext,
                home_team_id: teamIds[f.home]!,
                away_team_id: teamIds[f.away]!,
                date_played: f.date,
                status: 'completed',
                round_name: f.round,
                round_order: f.roundOrder,
                updated_at: new Date(),
            })
            .onConflict((oc) => oc.doNothing())
            .returning(['id', 'external_id'])
            .execute();

        fixtureIds[f.ext] =
            row?.id ??
            (
                await db
                    .selectFrom('fixtures')
                    .select('id')
                    .where('external_id', '=', f.ext)
                    .where('competition_id', '=', competitionId)
                    .executeTakeFirstOrThrow()
            ).id;
    }

    // ── Rubbers (match results) ───────────────────────────────────────────────
    // Fixture 1: Brentwood A vs Hutton A — 3 rubbers
    const rubbers = [
        // fix-1: Brentwood A vs Hutton A
        { fix: 'fix-1', ext: 'r1', home: 'alice-j', away: 'charlie-b', hg: 3, ag: 1, outcome: 'normal' as const },
        { fix: 'fix-1', ext: 'r2', home: 'bob-s', away: 'diana-p', hg: 2, ag: 3, outcome: 'normal' as const },
        { fix: 'fix-1', ext: 'r3', home: 'alice-j', away: 'diana-p', hg: 3, ag: 0, outcome: 'normal' as const },
        // fix-2: Shenfield A vs Chelmsford A
        { fix: 'fix-2', ext: 'r4', home: 'edward-n', away: 'george-l', hg: 3, ag: 2, outcome: 'normal' as const },
        { fix: 'fix-2', ext: 'r5', home: 'fiona-a', away: 'helen-t', hg: 1, ag: 3, outcome: 'normal' as const },
        { fix: 'fix-2', ext: 'r6', home: 'edward-n', away: 'helen-t', hg: 0, ag: 0, outcome: 'walkover' as const },
        // fix-3: Hutton A vs Shenfield A
        { fix: 'fix-3', ext: 'r7', home: 'charlie-b', away: 'edward-n', hg: 3, ag: 1, outcome: 'normal' as const },
        { fix: 'fix-3', ext: 'r8', home: 'diana-p', away: 'fiona-a', hg: 3, ag: 2, outcome: 'normal' as const },
        // fix-4: Chelmsford A vs Brentwood A
        { fix: 'fix-4', ext: 'r9', home: 'george-l', away: 'alice-j', hg: 1, ag: 3, outcome: 'normal' as const },
        { fix: 'fix-4', ext: 'r10', home: 'helen-t', away: 'bob-s', hg: 3, ag: 0, outcome: 'normal' as const },
    ];

    for (const r of rubbers) {
        await db
            .insertInto('rubbers')
            .values({
                fixture_id: fixtureIds[r.fix]!,
                external_id: r.ext,
                home_player_1_id: playerIds[r.home]!,
                away_player_1_id: playerIds[r.away]!,
                home_games_won: r.hg,
                away_games_won: r.ag,
                outcome_type: r.outcome,
                updated_at: new Date(),
            })
            .onConflict((oc) => oc.doNothing())
            .execute();
    }

    // Print useful IDs for .env / curl testing
    console.log('\n🎉 Seed complete! Useful IDs:\n');
    console.log(`  Competition : ${competitionId}`);
    console.log(`  Teams       : ${JSON.stringify(teamIds, null, 2)}`);
    console.log(`  Players     : ${JSON.stringify(playerIds, null, 2)}`);
    console.log(`\n  Set VITE_COMPETITION_IDS in apps/web/.env to:`);
    console.log(`  VITE_COMPETITION_IDS=[{"id":"${competitionId}","name":"Premier Division","division":"Premier Division"}]`);

    await db.destroy();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
