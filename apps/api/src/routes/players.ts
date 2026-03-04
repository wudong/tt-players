import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';
import { sql } from 'kysely';

const ParamsSchema = z.object({
    id: z.string().uuid(),
});

const SearchQuerySchema = z.object({
    q: z.string().min(1).default(''),
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
});

const RubberItemSchema = z.object({
    id: z.string().uuid(),
    fixture_id: z.string().uuid(),
    date: z.string(),
    league: z.string(),
    opponent: z.string(),
    result: z.string(),
    isWin: z.boolean(),
});

const ErrorSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
});

export function playersRoutes(db: Kysely<Database>): FastifyPluginAsync {
    return async function (fastify) {
        const app = fastify.withTypeProvider<ZodTypeProvider>();

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
                const { q } = request.query;

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
                    .select([
                        'ep.id',
                        'ep.name',
                        sql<number>`COUNT(r.id)`.as('played'),
                        sql<number>`SUM(CASE WHEN (r.home_player_1_id = ep.id AND r.home_games_won > r.away_games_won) OR (r.away_player_1_id = ep.id AND r.away_games_won > r.home_games_won) THEN 1 ELSE 0 END)`.as('wins')
                    ])
                    .where('ep.deleted_at', 'is', null)
                    .groupBy('ep.id');

                if (q) {
                    query = query.where('ep.name', 'ilike', `%${q}%`);
                    query = query.orderBy('ep.name', 'asc');
                } else {
                    query = query.orderBy('played', 'desc');
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

                return reply.send({
                    player_id: player.id,
                    player_name: player.name,
                    wins: Number(wins),
                    losses: Number(losses),
                    total: Number(total),
                    nemesis: nemesisStr,
                    duo: duoStr,
                    streak: streakStr,
                });
            }
        );

        app.get(
            '/:id/rubbers',
            {
                schema: {
                    params: ParamsSchema,
                    response: {
                        200: z.object({ data: z.array(RubberItemSchema) }),
                        404: ErrorSchema,
                        500: ErrorSchema,
                    },
                },
            },
            async (request, reply) => {
                const { id } = request.params;

                const matches = await sql<any>`
                    SELECT 
                        r.id,
                        r.fixture_id,
                        f.date_played as date,
                        c.name as league,
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
                    LIMIT 20
                `.execute(db);

                const data = matches.rows.map((m: any) => ({
                    id: m.id,
                    fixture_id: m.fixture_id,
                    date: new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    league: m.league,
                    opponent: m.opponent ?? 'Unknown',
                    result: m.isWin ? m.result_win : m.result_loss,
                    isWin: m.isWin,
                }));

                return reply.send({ data });
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
