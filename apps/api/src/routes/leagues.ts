import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

const DivisionSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
});

const RegionSchema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
});

const LeagueSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    platform: z.string(),
    season_id: z.string().uuid(),
    season: z.string(),
    regions: z.array(RegionSchema),
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
                        's.id as season_id',
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

                const leagueIds = Array.from(new Set(rows.map((row) => row.league_id)));
                const regionRows = leagueIds.length === 0
                    ? []
                    : await db
                        .selectFrom('league_regions as lr')
                        .innerJoin('regions as r', 'r.id', 'lr.region_id')
                        .select([
                            'lr.league_id as league_id',
                            'r.id as region_id',
                            'r.slug as region_slug',
                            'r.name as region_name',
                        ])
                        .where('lr.league_id', 'in', leagueIds)
                        .orderBy('r.name', 'asc')
                        .execute();

                const leagueMap = new Map<string, {
                    id: string;
                    name: string;
                    platform: string;
                    season_id: string;
                    season: string;
                    regions: { id: string; slug: string; name: string }[];
                    divisions: { id: string; name: string }[];
                }>();

                for (const row of rows) {
                    if (!leagueMap.has(row.league_id)) {
                        leagueMap.set(row.league_id, {
                            id: row.league_id,
                            name: row.league_name,
                            platform: row.platform_name,
                            season_id: row.season_id,
                            season: row.season_name,
                            regions: [],
                            divisions: [],
                        });
                    }
                    leagueMap.get(row.league_id)!.divisions.push({
                        id: row.competition_id,
                        name: row.division_name,
                    });
                }

                for (const row of regionRows) {
                    const league = leagueMap.get(row.league_id);
                    if (!league) continue;
                    league.regions.push({
                        id: row.region_id,
                        slug: row.region_slug,
                        name: row.region_name,
                    });
                }

                return reply.send({ data: Array.from(leagueMap.values()) });
            },
        );
    };
}
