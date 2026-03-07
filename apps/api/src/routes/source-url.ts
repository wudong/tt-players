import { sql, type Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

interface SourceContext {
    competitionExternalId: string;
    seasonExternalId: string;
    leagueExternalId: string;
    platformBaseUrl: string;
}

interface FindSourceUrlOptions {
    db: Kysely<Database>;
    context: SourceContext;
    preferredBefore: Date | null;
    patterns: string[];
}

function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniq(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
}

function buildSlugTokenCandidates(value: string): string[] {
    const normalized = value.trim().toLowerCase();
    return uniq([
        normalized,
        normalized.replace(/-/g, '_'),
        normalized.replace(/_/g, '-'),
    ]);
}

function buildSeasonTokenCandidates(value: string): string[] {
    const base = value.trim().toLowerCase().replace(/^tt365-/, '');
    const underscored = base.replace(/-/g, '_');
    return uniq([base, underscored]);
}

function deriveLeaguePathHint(context: SourceContext): string | null {
    if (!context.platformBaseUrl.toLowerCase().includes('tabletennis365')) return null;
    return context.leagueExternalId.toLowerCase().replace(/-tt365$/, '') || null;
}

async function findMatchingUrl({
    db,
    context,
    preferredBefore,
    patterns,
}: FindSourceUrlOptions): Promise<string | null> {
    const leaguePathHint = deriveLeaguePathHint(context);
    const passes = preferredBefore ? [preferredBefore, null] : [null];

    for (const before of passes) {
        for (const pattern of patterns) {
            let query = db
                .selectFrom('raw_scrape_logs as r')
                .select(['r.endpoint_url'])
                .where('r.status', '=', 'processed')
                .where(sql<boolean>`lower(r.endpoint_url) ~ ${pattern}`);

            if (before) {
                query = query.where('r.scraped_at', '<=', before);
            }

            if (leaguePathHint) {
                query = query.where(
                    sql<boolean>`lower(r.endpoint_url) like ${`%/${leaguePathHint}/%`}`,
                );
            }

            const row = await query.orderBy('r.scraped_at', 'desc').executeTakeFirst();
            if (row?.endpoint_url) return row.endpoint_url;
        }
    }

    return null;
}

export async function resolveCompetitionSourceUrl(
    db: Kysely<Database>,
    context: SourceContext,
    preferredBefore: Date | null,
): Promise<string | null> {
    const competitionTokens = buildSlugTokenCandidates(context.competitionExternalId);
    const seasonTokens = buildSeasonTokenCandidates(context.seasonExternalId);

    const patterns: string[] = [];

    // TT Leagues API endpoints.
    for (const token of competitionTokens) {
        const escaped = escapeRegex(token);
        patterns.push(`/api/divisions/${escaped}/standings(\\?|$)`);
        patterns.push(`/api/divisions/${escaped}/matches(\\?|$)`);
    }

    // TT365 standings/table pages.
    for (const seasonToken of seasonTokens) {
        const seasonEscaped = escapeRegex(seasonToken);
        for (const compToken of competitionTokens) {
            const compEscaped = escapeRegex(compToken);
            patterns.push(`/tables/${seasonEscaped}/${compEscaped}(/|\\?|#|$)`);
            patterns.push(`/results/${seasonEscaped}/${compEscaped}(/|\\?|#|$)`);
        }
    }

    // Fallback if season token changed in source.
    for (const compToken of competitionTokens) {
        const compEscaped = escapeRegex(compToken);
        patterns.push(`/tables/.+/${compEscaped}(/|\\?|#|$)`);
        patterns.push(`/results/.+/${compEscaped}(/|\\?|#|$)`);
    }

    return findMatchingUrl({
        db,
        context,
        preferredBefore,
        patterns,
    });
}

export async function resolveFixtureSourceUrl(
    db: Kysely<Database>,
    fixtureExternalId: string,
    context: SourceContext,
    preferredBefore: Date | null,
): Promise<string | null> {
    const fixtureTokens = buildSlugTokenCandidates(fixtureExternalId);
    const seasonTokens = buildSeasonTokenCandidates(context.seasonExternalId);
    const patterns: string[] = [];

    // TT365 match card pages.
    for (const seasonToken of seasonTokens) {
        const seasonEscaped = escapeRegex(seasonToken);
        for (const fixtureToken of fixtureTokens) {
            const fixtureEscaped = escapeRegex(fixtureToken);
            patterns.push(`/results/matchcard/${seasonEscaped}/${fixtureEscaped}(/|\\?|#|$)`);
        }
    }

    for (const fixtureToken of fixtureTokens) {
        const fixtureEscaped = escapeRegex(fixtureToken);
        patterns.push(`/results/matchcard/.+/${fixtureEscaped}(/|\\?|#|$)`);
        patterns.push(`/api/matches/${fixtureEscaped}/sets(\\?|$)`);
        patterns.push(`/api/matches/${fixtureEscaped}(\\?|$)`);
    }

    const directSource = await findMatchingUrl({
        db,
        context,
        preferredBefore,
        patterns,
    });

    if (directSource) return directSource;

    return resolveCompetitionSourceUrl(db, context, preferredBefore);
}
