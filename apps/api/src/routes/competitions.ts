import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

const ParamsSchema = z.object({
    id: z.string().uuid(),
});

const StandingItemSchema = z.object({
    position: z.number().int(),
    team_id: z.string().uuid(),
    team_name: z.string(),
    played: z.number().int(),
    won: z.number().int(),
    drawn: z.number().int(),
    lost: z.number().int(),
    points: z.number().int(),
});

const ResponseSchema = z.object({
    data: z.array(StandingItemSchema),
});

const ErrorSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
});

export function competitionsRoutes(db: Kysely<Database>): FastifyPluginAsync {
    return async function (fastify) {
        const app = fastify.withTypeProvider<ZodTypeProvider>();

        app.get(
            '/:id/standings',
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

                // Verify competition exists
                const competition = await db
                    .selectFrom('competitions')
                    .select('id')
                    .where('id', '=', id)
                    .where('deleted_at', 'is', null)
                    .executeTakeFirst();

                if (!competition) {
                    return reply.status(404).send({
                        error: `Competition ${id} not found`,
                        statusCode: 404,
                    });
                }

                const rows = await db
                    .selectFrom('league_standings as ls')
                    .innerJoin('teams as t', 't.id', 'ls.team_id')
                    .select([
                        'ls.position',
                        'ls.team_id',
                        't.name as team_name',
                        'ls.played',
                        'ls.won',
                        'ls.drawn',
                        'ls.lost',
                        'ls.points',
                    ])
                    .where('ls.competition_id', '=', id)
                    .where('ls.deleted_at', 'is', null)
                    .orderBy('ls.position', 'asc')
                    .execute();

                return reply.send({ data: rows });
            },
        );
    };
}
