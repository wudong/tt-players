import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

const ParamsSchema = z.object({
    id: z.string().uuid(),
});

const RubberItemSchema = z.object({
    id: z.string().uuid(),
    fixture_id: z.string().uuid(),
    is_doubles: z.boolean(),
    home_player_1_id: z.string().uuid().nullable(),
    home_player_2_id: z.string().uuid().nullable(),
    away_player_1_id: z.string().uuid().nullable(),
    away_player_2_id: z.string().uuid().nullable(),
    home_player_1_name: z.string().nullable(),
    home_player_2_name: z.string().nullable(),
    away_player_1_name: z.string().nullable(),
    away_player_2_name: z.string().nullable(),
    home_games_won: z.number().int(),
    away_games_won: z.number().int(),
});

const ErrorSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
});

export function fixturesRoutes(db: Kysely<Database>): FastifyPluginAsync {
    return async function (fastify) {
        const app = fastify.withTypeProvider<ZodTypeProvider>();

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

                const fixture = await db
                    .selectFrom('fixtures')
                    .select('id')
                    .where('id', '=', id)
                    .where('deleted_at', 'is', null)
                    .executeTakeFirst();

                if (!fixture) {
                    return reply.status(404).send({
                        error: `Fixture ${id} not found`,
                        statusCode: 404,
                    });
                }

                const rubbers = await db
                    .selectFrom('rubbers')
                    .leftJoin('external_players as hp1', 'hp1.id', 'rubbers.home_player_1_id')
                    .leftJoin('external_players as hp2', 'hp2.id', 'rubbers.home_player_2_id')
                    .leftJoin('external_players as ap1', 'ap1.id', 'rubbers.away_player_1_id')
                    .leftJoin('external_players as ap2', 'ap2.id', 'rubbers.away_player_2_id')
                    .select([
                        'rubbers.id',
                        'rubbers.fixture_id',
                        'rubbers.is_doubles',
                        'rubbers.home_player_1_id',
                        'rubbers.home_player_2_id',
                        'rubbers.away_player_1_id',
                        'rubbers.away_player_2_id',
                        'rubbers.home_games_won',
                        'rubbers.away_games_won',
                        'hp1.name as home_player_1_name',
                        'hp2.name as home_player_2_name',
                        'ap1.name as away_player_1_name',
                        'ap2.name as away_player_2_name',
                    ])
                    .where('rubbers.fixture_id', '=', id)
                    .where('rubbers.deleted_at', 'is', null)
                    .orderBy('rubbers.created_at', 'asc')
                    .execute();

                return reply.send({ data: rubbers as any });
            }
        );
    };
}
