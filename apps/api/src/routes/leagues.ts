import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

const DivisionSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
});

const LeagueSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    platform: z.string(),
    season: z.string(),
    divisions: z.array(DivisionSchema),
});

const ResponseSchema = z.object({
    data: z.array(LeagueSchema),
});

/**
 * GET /leagues — returns all leagues grouped with their divisions.
 * Used by the frontend to dynamically list leagues without needing
 * hardcoded competition IDs.
 */
export function leaguesRoutes(db: Kysely<Database>): FastifyPluginAsync {
    return async function (fastify) {
        const app = fastify.withTypeProvider<ZodTypeProvider>();

        app.get(
            '/',
            {
                schema: {
                    response: {
                        200: ResponseSchema,
                    },
                },
            },
            async (_request, reply) => {
                const rows = await db
                    .selectFrom('competitions as c')
                    .innerJoin('seasons as s', 's.id', 'c.season_id')
                    .innerJoin('leagues as l', 'l.id', 's.league_id')
                    .innerJoin('platforms as p', 'p.id', 'l.platform_id')
                    .select([
                        'l.id as league_id',
                        'l.name as league_name',
                        'p.name as platform_name',
                        's.name as season_name',
                        'c.id as competition_id',
                        'c.name as division_name',
                    ])
                    .where('c.deleted_at', 'is', null)
                    .where('l.deleted_at', 'is', null)
                    .where('s.is_active', '=', true)
                    .orderBy('l.name', 'asc')
                    .orderBy('c.name', 'asc')
                    .execute();

                // Group by league
                const leagueMap = new Map<string, {
                    id: string;
                    name: string;
                    platform: string;
                    season: string;
                    divisions: { id: string; name: string }[];
                }>();

                for (const row of rows) {
                    if (!leagueMap.has(row.league_id)) {
                        leagueMap.set(row.league_id, {
                            id: row.league_id,
                            name: row.league_name,
                            platform: row.platform_name,
                            season: row.season_name,
                            divisions: [],
                        });
                    }
                    leagueMap.get(row.league_id)!.divisions.push({
                        id: row.competition_id,
                        name: row.division_name,
                    });
                }

                return reply.send({ data: Array.from(leagueMap.values()) });
            },
        );
    };
}
