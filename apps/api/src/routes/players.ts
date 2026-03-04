import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';
import { sql } from 'kysely';

const ParamsSchema = z.object({
    id: z.string().uuid(),
});

const PaginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

const SearchQuerySchema = z.object({
    q: z.string().optional(),
    league_ids: z.string().optional(),
});

const LeadersQuerySchema = z.object({
    mode: z.enum(['win_pct', 'most_played', 'combined']).default('combined'),
    league_ids: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    min_played: z.coerce.number().int().min(1).max(100).default(3),
});

const SearchResponseSchema = z.object({
    data: z.array(
        z.object({
            id: z.string().uuid(),
            name: z.string(),
            played: z.number().int(),
            wins: z.number().int(),
        })
    ),
});

const ResponseSchema = z.object({
    player_id: z.string().uuid(),
    player_name: z.string(),
    wins: z.number().int(),
    losses: z.number().int(),
    total: z.number().int(),
});

const ExtendedResponseSchema = ResponseSchema.extend({
    nemesis: z.string(),
    duo: z.string(),
    streak: z.string(),
    most_played_opponents: z.array(
        z.object({
            opponent_id: z.string().uuid(),
            opponent_name: z.string(),
            played: z.number().int(),
            wins: z.number().int(),
            losses: z.number().int(),
            win_rate: z.number().int(),
        }),
    ),
});

const CurrentSeasonAffiliationSchema = z.object({
    team_id: z.string().uuid(),
    team_name: z.string(),
    league_id: z.string().uuid(),
    league_name: z.string(),
    season_id: z.string().uuid(),
    season_name: z.string(),
    competition_name: z.string(),
});

const RubberItemSchema = z.object({
    id: z.string().uuid(),
    fixture_id: z.string().uuid(),
    date: z.string(),
    league: z.string(),
    opponent: z.string(),
    opponent_id: z.string().uuid().nullable(),
    result: z.string(),
    isWin: z.boolean(),
});

const ErrorSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
});

const LeaderItemSchema = z.object({
    rank: z.number().int(),
    player_id: z.string().uuid(),
    player_name: z.string(),
    played: z.number().int(),
    wins: z.number().int(),
    losses: z.number().int(),
    win_rate: z.number(),
    score: z.number().nullable(),
});

export function playersRoutes(db: Kysely<Database>): FastifyPluginAsync {
    return async function (fastify) {
        const app = fastify.withTypeProvider<ZodTypeProvider>();

        app.get(
            '/leaders',
            {
                schema: {
                    querystring: LeadersQuerySchema,
                    response: {
                        200: z.object({
                            mode: z.enum(['win_pct', 'most_played', 'combined']),
                            formula: z.string(),
                            min_played: z.number().int(),
                            data: z.array(LeaderItemSchema),
                        }),
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { mode, limit, min_played: minPlayed } = request.query;
                const leagueCsv = (request.query.league_ids ?? '')
                    .split(',')
                    .map((id) => id.trim())
                    .filter((id) => id.length > 0)
                    .join(',');

                const aggregateRes = await sql<{
                    player_id: string;
                    player_name: string;
                    played: number;
                    wins: number;
                    losses: number;
                    win_rate: number;
                }>`
                    WITH singles AS (
                        SELECT
                            r.home_player_1_id AS player_id,
                            CASE WHEN r.home_games_won > r.away_games_won THEN 1 ELSE 0 END AS is_win
                        FROM rubbers r
                        JOIN fixtures f ON f.id = r.fixture_id
                        JOIN competitions c ON c.id = f.competition_id
                        JOIN seasons s ON s.id = c.season_id
                        WHERE r.is_doubles = false
                          AND r.deleted_at IS NULL
                          AND r.outcome_type != 'walkover'
                          AND r.home_player_1_id IS NOT NULL
                          AND (${leagueCsv} = '' OR s.league_id::text = ANY(string_to_array(${leagueCsv}, ',')))

                        UNION ALL

                        SELECT
                            r.away_player_1_id AS player_id,
                            CASE WHEN r.away_games_won > r.home_games_won THEN 1 ELSE 0 END AS is_win
                        FROM rubbers r
                        JOIN fixtures f ON f.id = r.fixture_id
                        JOIN competitions c ON c.id = f.competition_id
                        JOIN seasons s ON s.id = c.season_id
                        WHERE r.is_doubles = false
                          AND r.deleted_at IS NULL
                          AND r.outcome_type != 'walkover'
                          AND r.away_player_1_id IS NOT NULL
                          AND (${leagueCsv} = '' OR s.league_id::text = ANY(string_to_array(${leagueCsv}, ',')))
                    ),
                    aggregated AS (
                        SELECT
                            player_id,
                            COUNT(*)::int AS played,
                            SUM(is_win)::int AS wins
                        FROM singles
                        GROUP BY player_id
                    )
                    SELECT
                        ep.id AS player_id,
                        ep.name AS player_name,
                        a.played,
                        a.wins,
                        (a.played - a.wins)::int AS losses,
                        ROUND((a.wins::numeric / NULLIF(a.played, 0)) * 100, 2)::float8 AS win_rate
                    FROM aggregated a
                    JOIN external_players ep ON ep.id = a.player_id
                    WHERE ep.deleted_at IS NULL
                `.execute(db);

                const baseRows = aggregateRes.rows.map((row) => ({
                    player_id: row.player_id,
                    player_name: row.player_name,
                    played: Number(row.played),
                    wins: Number(row.wins),
                    losses: Number(row.losses),
                    win_rate: Number(row.win_rate),
                    score: null as number | null,
                }));

                let formula = 'Ranked by combined score: 70% win rate + 30% match volume (capped at 30 matches).';
                let ranked = baseRows;

                if (mode === 'win_pct') {
                    formula = `Ranked by win rate, minimum ${minPlayed} matches, tie-breakers: played then wins.`;
                    ranked = ranked
                        .filter((row) => row.played >= minPlayed)
                        .sort((a, b) =>
                            b.win_rate - a.win_rate
                            || b.played - a.played
                            || b.wins - a.wins
                            || a.player_name.localeCompare(b.player_name));
                } else if (mode === 'most_played') {
                    formula = 'Ranked by matches played, tie-breakers: wins then win rate.';
                    ranked = ranked
                        .sort((a, b) =>
                            b.played - a.played
                            || b.wins - a.wins
                            || b.win_rate - a.win_rate
                            || a.player_name.localeCompare(b.player_name));
                } else {
                    ranked = ranked
                        .filter((row) => row.played >= minPlayed)
                        .map((row) => ({
                            ...row,
                            score: Math.round((((row.win_rate * 0.7) + (Math.min(row.played, 30) / 30) * 100 * 0.3) * 100)) / 100,
                        }))
                        .sort((a, b) =>
                            (b.score ?? 0) - (a.score ?? 0)
                            || b.played - a.played
                            || b.wins - a.wins
                            || a.player_name.localeCompare(b.player_name));
                }

                const data = ranked.slice(0, limit).map((row, index) => ({
                    rank: index + 1,
                    ...row,
                }));

                return reply.send({
                    mode,
                    formula,
                    min_played: minPlayed,
                    data,
                });
            },
        );

        app.get(
            '/search',
            {
                schema: {
                    querystring: SearchQuerySchema,
                    response: {
                        200: SearchResponseSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const normalizedQuery = request.query.q?.trim() ?? '';
                const leagueIds = (request.query.league_ids ?? '')
                    .split(',')
                    .map((id) => id.trim())
                    .filter((id) => id.length > 0);

                let query = db
                    .selectFrom('external_players as ep')
                    .leftJoin('rubbers as r', (join) =>
                        join.on((eb) => eb.or([
                            eb('r.home_player_1_id', '=', eb.ref('ep.id')),
                            eb('r.away_player_1_id', '=', eb.ref('ep.id'))
                        ]))
                            .on('r.deleted_at', 'is', null)
                            .on('r.is_doubles', '=', false)
                            .on('r.outcome_type', '!=', 'walkover')
                    )
                    .leftJoin('fixtures as f', (join) =>
                        join.onRef('f.id', '=', 'r.fixture_id')
                            .on('f.deleted_at', 'is', null)
                    )
                    .leftJoin('competitions as c', (join) =>
                        join.onRef('c.id', '=', 'f.competition_id')
                            .on('c.deleted_at', 'is', null)
                    )
                    .leftJoin('seasons as s', (join) =>
                        join.onRef('s.id', '=', 'c.season_id')
                            .on('s.deleted_at', 'is', null)
                    )
                    .select([
                        'ep.id',
                        'ep.name',
                        sql<number>`COUNT(r.id)`.as('played'),
                        sql<number>`SUM(CASE WHEN (r.home_player_1_id = ep.id AND r.home_games_won > r.away_games_won) OR (r.away_player_1_id = ep.id AND r.away_games_won > r.home_games_won) THEN 1 ELSE 0 END)`.as('wins')
                    ])
                    .where('ep.deleted_at', 'is', null)
                    .groupBy('ep.id');

                if (leagueIds.length > 0) {
                    query = query.where('s.league_id', 'in', leagueIds);
                }

                if (normalizedQuery) {
                    query = query.where('ep.name', 'ilike', `%${normalizedQuery}%`);
                    query = query.orderBy('ep.name', 'asc');
                } else {
                    query = query.orderBy('played', 'desc');
                    query = query.orderBy('wins', 'desc');
                    query = query.orderBy('ep.name', 'asc');
                }

                const rows = await query.limit(20).execute();

                return reply.send({
                    data: rows.map(r => ({
                        id: r.id,
                        name: r.name,
                        played: Number(r.played),
                        wins: Number(r.wins),
                    }))
                });
            }
        );

        app.get(
            '/:id/stats',
            {
                schema: {
                    params: ParamsSchema,
                    response: {
                        200: ResponseSchema,
                        404: ErrorSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { id } = request.params;

                // Verify player exists
                const player = await db
                    .selectFrom('external_players')
                    .select(['id', 'name'])
                    .where('id', '=', id)
                    .where('deleted_at', 'is', null)
                    .executeTakeFirst();

                if (!player) {
                    return reply.status(404).send({
                        error: `Player ${id} not found`,
                        statusCode: 404,
                    });
                }

                // Aggregate wins/losses, excluding walkovers
                // A rubber is a win for the player if:
                //   - player is home (home_player_1_id = id) AND home_games_won > away_games_won
                //   - player is away (away_player_1_id = id) AND away_games_won > home_games_won
                const { wins, losses, total } = await db
                    .selectFrom('rubbers')
                    .select([
                        sql<number>`
                            COUNT(*) FILTER (
                                WHERE (home_player_1_id = ${id} AND home_games_won > away_games_won)
                                   OR (away_player_1_id = ${id} AND away_games_won > home_games_won)
                            )
                        `.as('wins'),
                        sql<number>`
                            COUNT(*) FILTER (
                                WHERE (home_player_1_id = ${id} AND home_games_won < away_games_won)
                                   OR (away_player_1_id = ${id} AND away_games_won < home_games_won)
                            )
                        `.as('losses'),
                        sql<number>`COUNT(*)`.as('total'),
                    ])
                    .where((eb) =>
                        eb.or([
                            eb('home_player_1_id', '=', id),
                            eb('away_player_1_id', '=', id),
                        ])
                    )
                    .where('outcome_type', '!=', 'walkover')
                    .where('deleted_at', 'is', null)
                    .executeTakeFirstOrThrow();

                return reply.send({
                    player_id: player.id,
                    player_name: player.name,
                    wins: Number(wins),
                    losses: Number(losses),
                    total: Number(total),
                });
            },
        );

        app.get(
            '/:id/stats/extended',
            {
                schema: {
                    params: ParamsSchema,
                    response: {
                        200: ExtendedResponseSchema,
                        404: ErrorSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { id } = request.params;

                const player = await db.selectFrom('external_players')
                    .select(['id', 'name'])
                    .where('id', '=', id)
                    .where('deleted_at', 'is', null)
                    .executeTakeFirst();

                if (!player) {
                    return reply.status(404).send({ error: `Player ${id} not found`, statusCode: 404 });
                }

                const { wins, losses, total } = await db
                    .selectFrom('rubbers')
                    .select([
                        sql<number>`COUNT(*) FILTER (WHERE (home_player_1_id = ${id} AND home_games_won > away_games_won) OR (away_player_1_id = ${id} AND away_games_won > home_games_won))`.as('wins'),
                        sql<number>`COUNT(*) FILTER (WHERE (home_player_1_id = ${id} AND home_games_won < away_games_won) OR (away_player_1_id = ${id} AND away_games_won < home_games_won))`.as('losses'),
                        sql<number>`COUNT(*)`.as('total'),
                    ])
                    .where((eb) => eb.or([eb('home_player_1_id', '=', id), eb('away_player_1_id', '=', id)]))
                    .where('outcome_type', '!=', 'walkover')
                    .where('deleted_at', 'is', null)
                    .executeTakeFirstOrThrow();

                // 1. Nemesis query
                const nemesisRes = await sql<{ opponent_name: string, losses: number, wins: number }>`
                    WITH opponents AS (
                        SELECT 
                            CASE WHEN home_player_1_id = ${id} THEN away_player_1_id ELSE home_player_1_id END as opp_id,
                            CASE WHEN (home_player_1_id = ${id} AND home_games_won < away_games_won) OR (away_player_1_id = ${id} AND away_games_won < home_games_won) THEN 1 ELSE 0 END as is_loss,
                            CASE WHEN (home_player_1_id = ${id} AND home_games_won > away_games_won) OR (away_player_1_id = ${id} AND away_games_won > home_games_won) THEN 1 ELSE 0 END as is_win
                        FROM rubbers
                        WHERE (home_player_1_id = ${id} OR away_player_1_id = ${id}) AND is_doubles = false AND deleted_at IS NULL AND outcome_type != 'walkover'
                    )
                    SELECT ep.name as opponent_name, SUM(is_loss) as losses, SUM(is_win) as wins
                    FROM opponents o
                    JOIN external_players ep ON ep.id = o.opp_id
                    GROUP BY o.opp_id, ep.name
                    HAVING SUM(is_loss) > 0
                    ORDER BY SUM(is_loss) DESC, SUM(is_win) ASC
                    LIMIT 1
                `.execute(db);

                // 2. Duo query
                const duoRes = await sql<{ partner_name: string, wins: number, total: number }>`
                    WITH partners AS (
                        SELECT 
                            CASE 
                                WHEN home_player_1_id = ${id} THEN home_player_2_id 
                                WHEN home_player_2_id = ${id} THEN home_player_1_id
                                WHEN away_player_1_id = ${id} THEN away_player_2_id
                                ELSE away_player_1_id
                            END as partner_id,
                            CASE WHEN (home_player_1_id = ${id} OR home_player_2_id = ${id}) AND home_games_won > away_games_won THEN 1
                                 WHEN (away_player_1_id = ${id} OR away_player_2_id = ${id}) AND away_games_won > home_games_won THEN 1 ELSE 0 END as is_win
                        FROM rubbers
                        WHERE (home_player_1_id = ${id} OR home_player_2_id = ${id} OR away_player_1_id = ${id} OR away_player_2_id = ${id})
                          AND is_doubles = true AND deleted_at IS NULL AND outcome_type != 'walkover'
                    )
                    SELECT ep.name as partner_name, SUM(is_win) as wins, COUNT(*) as total
                    FROM partners p
                    JOIN external_players ep ON ep.id = p.partner_id
                    WHERE p.partner_id IS NOT NULL
                    GROUP BY p.partner_id, ep.name
                    HAVING SUM(is_win) > 0
                    ORDER BY SUM(is_win) DESC
                    LIMIT 1
                `.execute(db);

                // 3. Streak
                const streakRes = await sql<{ result: string }>`
                    SELECT 
                        CASE 
                            WHEN (home_player_1_id = ${id} AND home_games_won > away_games_won) OR (away_player_1_id = ${id} AND away_games_won > home_games_won) THEN 'W'
                            ELSE 'L'
                        END as result
                    FROM rubbers
                    JOIN fixtures ON fixtures.id = rubbers.fixture_id
                    WHERE (home_player_1_id = ${id} OR away_player_1_id = ${id})
                      AND is_doubles = false AND rubbers.deleted_at IS NULL AND outcome_type != 'walkover'
                    ORDER BY fixtures.date_played DESC
                    LIMIT 10
                `.execute(db);

                const mostPlayedOpponentsRes = await sql<{
                    opponent_id: string;
                    opponent_name: string;
                    played: number;
                    wins: number;
                    losses: number;
                }>`
                    WITH opponents AS (
                        SELECT
                            CASE WHEN home_player_1_id = ${id} THEN away_player_1_id ELSE home_player_1_id END as opp_id,
                            CASE
                                WHEN (home_player_1_id = ${id} AND home_games_won > away_games_won)
                                  OR (away_player_1_id = ${id} AND away_games_won > home_games_won) THEN 1
                                ELSE 0
                            END as is_win,
                            CASE
                                WHEN (home_player_1_id = ${id} AND home_games_won < away_games_won)
                                  OR (away_player_1_id = ${id} AND away_games_won < home_games_won) THEN 1
                                ELSE 0
                            END as is_loss
                        FROM rubbers
                        WHERE (home_player_1_id = ${id} OR away_player_1_id = ${id})
                          AND is_doubles = false
                          AND deleted_at IS NULL
                          AND outcome_type != 'walkover'
                    )
                    SELECT
                        ep.id as opponent_id,
                        ep.name as opponent_name,
                        COUNT(*)::int as played,
                        SUM(o.is_win)::int as wins,
                        SUM(o.is_loss)::int as losses
                    FROM opponents o
                    JOIN external_players ep ON ep.id = o.opp_id
                    WHERE o.opp_id IS NOT NULL
                      AND ep.deleted_at IS NULL
                    GROUP BY ep.id, ep.name
                    ORDER BY COUNT(*) DESC, SUM(o.is_win) DESC, ep.name ASC
                    LIMIT 5
                `.execute(db);

                // calculate streak string
                let streakStr = 'None';
                if (streakRes.rows.length > 0) {
                    const currentType = streakRes.rows[0].result;
                    let count = 0;
                    for (const row of streakRes.rows) {
                        if (row.result === currentType) count++;
                        else break;
                    }
                    streakStr = `${currentType}${count}`;
                }

                let nemesisStr = 'None';
                if (nemesisRes.rows.length > 0) {
                    const r = nemesisRes.rows[0];
                    nemesisStr = `${r.opponent_name} (${r.wins}W-${r.losses}L)`;
                }

                let duoStr = 'None';
                if (duoRes.rows.length > 0) {
                    const r = duoRes.rows[0];
                    const wr = Math.round((Number(r.wins) / Number(r.total)) * 100);
                    duoStr = `${r.partner_name} (${wr}% WR)`;
                }

                const mostPlayedOpponents = mostPlayedOpponentsRes.rows.map((row) => ({
                    opponent_id: row.opponent_id,
                    opponent_name: row.opponent_name,
                    played: Number(row.played),
                    wins: Number(row.wins),
                    losses: Number(row.losses),
                    win_rate: Number(row.played) > 0
                        ? Math.round((Number(row.wins) / Number(row.played)) * 100)
                        : 0,
                }));

                return reply.send({
                    player_id: player.id,
                    player_name: player.name,
                    wins: Number(wins),
                    losses: Number(losses),
                    total: Number(total),
                    nemesis: nemesisStr,
                    duo: duoStr,
                    streak: streakStr,
                    most_played_opponents: mostPlayedOpponents,
                });
            }
        );

        app.get(
            '/:id/affiliations/current-season',
            {
                schema: {
                    params: ParamsSchema,
                    response: {
                        200: z.object({ data: z.array(CurrentSeasonAffiliationSchema) }),
                        404: ErrorSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { id } = request.params;

                const player = await db
                    .selectFrom('external_players')
                    .select(['id'])
                    .where('id', '=', id)
                    .where('deleted_at', 'is', null)
                    .executeTakeFirst();

                if (!player) {
                    return reply.status(404).send({
                        error: `Player ${id} not found`,
                        statusCode: 404,
                    });
                }

                const rows = await sql<{
                    team_id: string;
                    team_name: string;
                    league_id: string;
                    league_name: string;
                    season_id: string;
                    season_name: string;
                    competition_name: string;
                }>`
                    WITH player_affiliations AS (
                        SELECT
                            f.home_team_id AS team_id,
                            l.id AS league_id,
                            l.name AS league_name,
                            s.id AS season_id,
                            s.name AS season_name,
                            c.name AS competition_name
                        FROM rubbers r
                        JOIN fixtures f ON f.id = r.fixture_id
                        JOIN competitions c ON c.id = f.competition_id
                        JOIN seasons s ON s.id = c.season_id
                        JOIN leagues l ON l.id = s.league_id
                        WHERE (r.home_player_1_id = ${id} OR r.home_player_2_id = ${id})
                          AND f.home_team_id IS NOT NULL
                          AND s.is_active = true
                          AND r.deleted_at IS NULL
                          AND f.deleted_at IS NULL
                          AND c.deleted_at IS NULL
                          AND s.deleted_at IS NULL
                          AND l.deleted_at IS NULL

                        UNION ALL

                        SELECT
                            f.away_team_id AS team_id,
                            l.id AS league_id,
                            l.name AS league_name,
                            s.id AS season_id,
                            s.name AS season_name,
                            c.name AS competition_name
                        FROM rubbers r
                        JOIN fixtures f ON f.id = r.fixture_id
                        JOIN competitions c ON c.id = f.competition_id
                        JOIN seasons s ON s.id = c.season_id
                        JOIN leagues l ON l.id = s.league_id
                        WHERE (r.away_player_1_id = ${id} OR r.away_player_2_id = ${id})
                          AND f.away_team_id IS NOT NULL
                          AND s.is_active = true
                          AND r.deleted_at IS NULL
                          AND f.deleted_at IS NULL
                          AND c.deleted_at IS NULL
                          AND s.deleted_at IS NULL
                          AND l.deleted_at IS NULL
                    )
                    SELECT DISTINCT
                        pa.team_id,
                        t.name AS team_name,
                        pa.league_id,
                        pa.league_name,
                        pa.season_id,
                        pa.season_name,
                        pa.competition_name
                    FROM player_affiliations pa
                    JOIN teams t ON t.id = pa.team_id
                    WHERE t.deleted_at IS NULL
                    ORDER BY pa.league_name ASC, pa.competition_name ASC, t.name ASC
                `.execute(db);

                return reply.send({
                    data: rows.rows,
                });
            },
        );

        app.get(
            '/:id/rubbers',
            {
                schema: {
                    params: ParamsSchema,
                    querystring: PaginationQuerySchema,
                    response: {
                        200: z.object({
                            total: z.number().int(),
                            limit: z.number().int(),
                            offset: z.number().int(),
                            data: z.array(RubberItemSchema),
                        }),
                        404: ErrorSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { id } = request.params;
                const { limit, offset } = request.query;

                const totalRes = await sql<{ count: number }>`
                    SELECT COUNT(*)::int as count
                    FROM rubbers r
                    WHERE (r.home_player_1_id = ${id} OR r.away_player_1_id = ${id})
                      AND r.is_doubles = false
                      AND r.deleted_at IS NULL
                `.execute(db);
                const count = totalRes.rows[0]?.count ?? 0;

                const matches = await sql<any>`
                    SELECT 
                        r.id,
                        r.fixture_id,
                        f.date_played as date,
                        c.name as league,
                        CASE WHEN r.home_player_1_id = ${id} THEN r.away_player_1_id ELSE r.home_player_1_id END as opponent_id,
                        CASE WHEN r.home_player_1_id = ${id} THEN ep_away.name ELSE ep_home.name END as opponent,
                        CASE 
                            WHEN (r.home_player_1_id = ${id} AND r.home_games_won > r.away_games_won) 
                              OR (r.away_player_1_id = ${id} AND r.away_games_won > r.home_games_won) THEN true
                            ELSE false
                        END as "isWin",
                        CASE 
                            WHEN r.home_player_1_id = ${id} THEN CONCAT('Won ', r.home_games_won, '-', r.away_games_won)
                            WHEN r.away_player_1_id = ${id} THEN CONCAT('Won ', r.away_games_won, '-', r.home_games_won)
                        END as result_win,
                        CASE 
                            WHEN r.home_player_1_id = ${id} THEN CONCAT('Lost ', r.home_games_won, '-', r.away_games_won)
                            WHEN r.away_player_1_id = ${id} THEN CONCAT('Lost ', r.away_games_won, '-', r.home_games_won)
                        END as result_loss
                    FROM rubbers r
                    JOIN fixtures f ON f.id = r.fixture_id
                    JOIN competitions c ON c.id = f.competition_id
                    LEFT JOIN external_players ep_home ON ep_home.id = r.home_player_1_id
                    LEFT JOIN external_players ep_away ON ep_away.id = r.away_player_1_id
                    WHERE (r.home_player_1_id = ${id} OR r.away_player_1_id = ${id})
                      AND r.is_doubles = false
                      AND r.deleted_at IS NULL
                    ORDER BY f.date_played DESC
                    LIMIT ${limit}
                    OFFSET ${offset}
                `.execute(db);

                const data = matches.rows.map((m: any) => ({
                    id: m.id,
                    fixture_id: m.fixture_id,
                    date: new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    league: m.league,
                    opponent: m.opponent ?? 'Unknown',
                    opponent_id: m.opponent_id,
                    result: m.isWin ? m.result_win : m.result_loss,
                    isWin: m.isWin,
                }));

                return reply.send({
                    total: Number(count),
                    limit,
                    offset,
                    data,
                });
            }
        );

        app.get(
            '/:id/h2h/:opponentId',
            {
                schema: {
                    params: z.object({
                        id: z.string().uuid(),
                        opponentId: z.string().uuid(),
                    }),
                    response: {
                        200: z.object({
                            player1_wins: z.number().int(),
                            player2_wins: z.number().int(),
                            encounters: z.array(RubberItemSchema),
                        }),
                        404: ErrorSchema,
                        500: ErrorSchema,
                    }
                }
            },
            async (request, reply) => {
                const { id, opponentId } = request.params;

                const matches = await sql<any>`
                    SELECT 
                        r.id,
                        r.fixture_id,
                        f.date_played as date,
                        c.name as league,
                        CASE WHEN r.home_player_1_id = ${id} THEN r.away_player_1_id ELSE r.home_player_1_id END as opponent_id,
                        CASE WHEN r.home_player_1_id = ${id} THEN ep_away.name ELSE ep_home.name END as opponent,
                        CASE 
                            WHEN (r.home_player_1_id = ${id} AND r.home_games_won > r.away_games_won) 
                              OR (r.away_player_1_id = ${id} AND r.away_games_won > r.home_games_won) THEN true
                            ELSE false
                        END as "isWin",
                        CASE 
                            WHEN r.home_player_1_id = ${id} THEN CONCAT('Won ', r.home_games_won, '-', r.away_games_won)
                            WHEN r.away_player_1_id = ${id} THEN CONCAT('Won ', r.away_games_won, '-', r.home_games_won)
                        END as result_win,
                        CASE 
                            WHEN r.home_player_1_id = ${id} THEN CONCAT('Lost ', r.home_games_won, '-', r.away_games_won)
                            WHEN r.away_player_1_id = ${id} THEN CONCAT('Lost ', r.away_games_won, '-', r.home_games_won)
                        END as result_loss
                    FROM rubbers r
                    JOIN fixtures f ON f.id = r.fixture_id
                    JOIN competitions c ON c.id = f.competition_id
                    LEFT JOIN external_players ep_home ON ep_home.id = r.home_player_1_id
                    LEFT JOIN external_players ep_away ON ep_away.id = r.away_player_1_id
                    WHERE ((r.home_player_1_id = ${id} AND r.away_player_1_id = ${opponentId}) 
                       OR (r.home_player_1_id = ${opponentId} AND r.away_player_1_id = ${id}))
                      AND r.is_doubles = false
                      AND r.deleted_at IS NULL
                    ORDER BY f.date_played DESC
                `.execute(db);

                let p1_wins = 0;
                let p2_wins = 0;

                const data = matches.rows.map((m: any) => {
                    if (m.isWin) p1_wins++;
                    else p2_wins++;

                    return {
                        id: m.id,
                        fixture_id: m.fixture_id,
                        date: new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                        league: m.league,
                        opponent: m.opponent ?? 'Unknown',
                        opponent_id: m.opponent_id,
                        result: m.isWin ? m.result_win : m.result_loss,
                        isWin: m.isWin,
                    };
                });

                return reply.send({
                    player1_wins: p1_wins,
                    player2_wins: p2_wins,
                    encounters: data,
                });
            }
        );
    };
}
