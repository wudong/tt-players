import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../../..');
const DOCS_DIR = resolve(ROOT_DIR, 'docs');
const CONFIG_DIR = resolve(__dirname, '../config');

const ENGLAND_DIRECTORY_URL = 'https://www.tabletennisengland.co.uk/leagues/';
const WALES_DIRECTORY_URL = 'https://tabletennis.wales/tt-leagues/';
const TT365_SITES_URL = 'https://www.tabletennis365.com/Sites';
const TT_ULSTER_LEAGUES_URL = 'https://tabletennisulster.com/leagues/';
const TTL_API_BASE = 'https://ttleagues-api.azurewebsites.net/api';
const REPORT_DATE = '2026-03-10';
const CUP_NAME_PATTERN = /\b(cup|knockout|ko|trophy|plate|shield|championship)\b/i;

type PlatformType =
    | 'tt365'
    | 'ttleagues'
    | 'custom'
    | 'unpublished'
    | 'unknown';

type ScrapeStatus =
    | 'ready'
    | 'unsupported_platform'
    | 'no_public_results_url'
    | 'inactive_or_unverified';

interface CandidateLink {
    label: string;
    url: string;
}

interface CandidateLeague {
    country: string;
    region: string;
    leagueName: string;
    sourceUrl: string;
    links: CandidateLink[];
    notes?: string;
}

interface TT365DivisionConfig {
    name: string;
    season: string;
    slug: string;
}

interface TTLeaguesDivisionConfig {
    name: string;
    divisionId: number;
}

interface LeagueConfigEntry {
    platform: 'tt365' | 'ttleagues';
    leagueName: string;
    externalId: string;
    seasonName: string;
    seasonExtId: string;
    baseUrl: string;
    divisions: Array<TT365DivisionConfig | TTLeaguesDivisionConfig>;
    history: {
        enabled: boolean;
        maxSeasons: number;
        includeCups?: boolean;
    };
    regions: string[];
}

interface ResearchRow {
    country: string;
    region: string;
    league_name: string;
    source_url: string;
    official_url: string | null;
    official_link_label: string | null;
    active_platform: PlatformType;
    active_url: string | null;
    scrape_status: ScrapeStatus;
    current_season_name: string | null;
    current_divisions: number | null;
    seasons_available: number | null;
    notes: string;
}

interface VerifiedLeague {
    row: ResearchRow;
    config: LeagueConfigEntry | null;
}

interface TT365Verification {
    seasonName: string;
    seasonToken: string;
    seasonsAvailable: number;
    divisions: TT365DivisionConfig[];
}

interface TTLeaguesVerification {
    seasonName: string;
    seasonsAvailable: number;
    divisions: TTLeaguesDivisionConfig[];
}

interface TTLeaguesCompetition {
    id: number;
    name: string;
}

interface TTLeaguesDivision {
    id: number;
    name: string;
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
    const res = await fetch(url, {
        headers: {
            'user-agent': 'tt-players-research/1.0',
            ...headers,
        },
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    return res.text();
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const res = await fetch(url, {
        headers: {
            'user-agent': 'tt-players-research/1.0',
            ...headers,
        },
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    return res.json() as Promise<T>;
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

function platformFromUrl(url: string | null): PlatformType {
    if (!url) return 'unknown';
    if (/tabletennis365\.com/i.test(url)) return 'tt365';
    if (/\.ttleagues\.com/i.test(url)) return 'ttleagues';
    return 'custom';
}

function pathSegmentFromUrl(url: string): string {
    const pathname = new URL(url).pathname.split('/').filter(Boolean)[0] ?? '';
    return pathname.toLowerCase();
}

function ttLeaguesSubdomain(url: string): string {
    const host = new URL(url).hostname;
    return host.split('.')[0]!.toLowerCase();
}

function orderLinks(links: CandidateLink[]): CandidateLink[] {
    const labelOrder = new Map<string, number>([
        ['website', 0],
        ['secondary website', 1],
        ['contact', 2],
    ]);

    return [...links].sort((a, b) => {
        const aOrder = labelOrder.get(a.label.toLowerCase()) ?? 99;
        const bOrder = labelOrder.get(b.label.toLowerCase()) ?? 99;
        return aOrder - bOrder;
    });
}

function parseEnglandDirectory(html: string): CandidateLeague[] {
    const $ = cheerio.load(html);
    return $('li.leagues').map((_index, item) => {
        const leagueName = normalizeWhitespace($(item).find('h6').first().text());
        const region = normalizeWhitespace($(item).find('p').first().text());
        const links = $(item).find('a[href]').map((_i, anchor) => ({
            label: normalizeWhitespace($(anchor).text()),
            url: normalizeUrl(new URL($(anchor).attr('href')!, ENGLAND_DIRECTORY_URL).toString()),
        })).get();

        return {
            country: 'England',
            region,
            leagueName,
            sourceUrl: ENGLAND_DIRECTORY_URL,
            links,
        } satisfies CandidateLeague;
    }).get();
}

function parseWalesDirectory(html: string): CandidateLeague[] {
    const $ = cheerio.load(html);
    const configured: Array<{ leagueName: string; region: string }> = [
        { leagueName: 'Cardiff & District Table Tennis League', region: 'Cardiff' },
        { leagueName: 'East Flintshire League', region: 'Flintshire' },
        { leagueName: 'Gwent Table Tennis League', region: 'Gwent' },
        { leagueName: 'Llandudno Table Tennis League', region: 'Conwy' },
        { leagueName: 'Pembrokeshire Table Tennis League', region: 'Pembrokeshire' },
        { leagueName: 'Swansea League', region: 'Swansea' },
        { leagueName: 'Wrexham League', region: 'Wrexham' },
    ];

    return configured.map((item) => {
        const anchor = $('a[href]').filter((_i, link) =>
            normalizeWhitespace($(link).text()) === item.leagueName,
        ).first();

        const links = anchor.length === 0
            ? []
            : [{
                label: 'Website',
                url: normalizeUrl(new URL(anchor.attr('href')!, WALES_DIRECTORY_URL).toString()),
            }];

        return {
            country: 'Wales',
            region: item.region,
            leagueName: item.leagueName,
            sourceUrl: WALES_DIRECTORY_URL,
            links,
            notes: anchor.length === 0
                ? 'Listed by Table Tennis Wales without a published results link.'
                : undefined,
        } satisfies CandidateLeague;
    });
}

function manualScottishCandidates(): CandidateLeague[] {
    return [
        {
            country: 'Scotland',
            region: 'Aberdeen',
            leagueName: 'Aberdeen & District Table Tennis Association',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/Aberdeen' }],
        },
        {
            country: 'Scotland',
            region: 'Dundee',
            leagueName: 'Dundee & District Table Tennis League',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/dundee' }],
        },
        {
            country: 'Scotland',
            region: 'Dumfries and Galloway',
            leagueName: 'Dumfries Table Tennis League',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/Dumfries' }],
        },
        {
            country: 'Scotland',
            region: 'Edinburgh',
            leagueName: 'Edinburgh & Lothians Table Tennis League',
            sourceUrl: 'https://www.edinburghtabletennis.com/',
            links: [{ label: 'Website', url: 'https://www.edinburghtabletennis.com/' }],
            notes: 'Public results are on a custom site rather than TT365 or TT Leagues.',
        },
        {
            country: 'Scotland',
            region: 'Perth and Kinross',
            leagueName: 'Perth Table Tennis Association',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/Perth' }],
        },
        {
            country: 'Scotland',
            region: 'Stirling',
            leagueName: 'Stirlingshire & Midland Counties Table Tennis League',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/SMC' }],
        },
        {
            country: 'Scotland',
            region: 'West of Scotland',
            leagueName: 'West of Scotland Table Tennis League',
            sourceUrl: TT365_SITES_URL,
            links: [{ label: 'Website', url: 'https://www.tabletennis365.com/WestofScotland' }],
        },
    ];
}

function manualNorthernIrelandRows(): VerifiedLeague[] {
    return [
        {
            row: {
                country: 'Northern Ireland',
                region: 'Belfast',
                league_name: 'Belfast and District Table Tennis League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: 5,
                seasons_available: null,
                notes: 'Table Tennis Ulster says results are uploaded via the app or website, but no public results URL is published.',
            },
            config: null,
        },
        {
            row: {
                country: 'Northern Ireland',
                region: 'County Down',
                league_name: 'Lecale League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: 2,
                seasons_available: null,
                notes: 'Official Table Tennis Ulster page lists the league but does not publish a results URL.',
            },
            config: null,
        },
        {
            row: {
                country: 'Northern Ireland',
                region: 'County Down',
                league_name: 'East Down Churches League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: 2,
                seasons_available: null,
                notes: 'Official Table Tennis Ulster page lists the league but does not publish a results URL.',
            },
            config: null,
        },
        {
            row: {
                country: 'Northern Ireland',
                region: 'County Antrim',
                league_name: 'County Antrim League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: 2,
                seasons_available: null,
                notes: 'Official Table Tennis Ulster page lists the league but does not publish a results URL.',
            },
            config: null,
        },
        {
            row: {
                country: 'Northern Ireland',
                region: 'Fermanagh',
                league_name: 'Fermanagh League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: null,
                seasons_available: null,
                notes: 'Official Table Tennis Ulster page lists the league but does not publish a results URL or divisions count.',
            },
            config: null,
        },
        {
            row: {
                country: 'Northern Ireland',
                region: 'Northern Ireland',
                league_name: 'Greystone League',
                source_url: TT_ULSTER_LEAGUES_URL,
                official_url: null,
                official_link_label: null,
                active_platform: 'unpublished',
                active_url: null,
                scrape_status: 'no_public_results_url',
                current_season_name: null,
                current_divisions: null,
                seasons_available: null,
                notes: 'Official Table Tennis Ulster page lists the league but does not publish a results URL or divisions count.',
            },
            config: null,
        },
    ];
}

function collectTT365CurrentDivisions(html: string, baseUrl: string): Map<string, Map<string, string>> {
    const $ = cheerio.load(html);
    const seasons = new Map<string, Map<string, string>>();

    $('a[href]').each((_index, anchor) => {
        const href = $(anchor).attr('href');
        if (!href) return;

        let url: URL;
        try {
            url = new URL(href, baseUrl);
        } catch {
            return;
        }

        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length < 4) return;
        if (!['tables', 'fixtures'].includes(segments[1]!.toLowerCase())) return;

        const season = decodeURIComponent(segments[2]!);
        const slug = decodeURIComponent(segments[3]!);
        if (slug.toLowerCase() === 'all_divisions') return;

        const name = normalizeWhitespace($(anchor).text()) || slug.replace(/_/g, ' ');
        const divisions = seasons.get(season) ?? new Map<string, string>();
        divisions.set(slug, name);
        seasons.set(season, divisions);
    });

    return seasons;
}

function collectTT365ArchiveSeasons(html: string, baseUrl: string): Set<string> {
    const $ = cheerio.load(html);
    const seasons = new Set<string>();

    $('a[href*="/Results/Categories/"]').each((_index, anchor) => {
        const href = $(anchor).attr('href');
        if (!href) return;

        try {
            const url = new URL(href, baseUrl);
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length >= 4) {
                seasons.add(decodeURIComponent(segments[3]!));
            }
        } catch {
            // Ignore malformed links.
        }
    });

    return seasons;
}

async function verifyTT365(baseUrl: string): Promise<TT365Verification> {
    const normalizedBaseUrl = normalizeUrl(baseUrl);
    const homepageHtml = await fetchText(normalizedBaseUrl);
    const homepageSeasonMap = collectTT365CurrentDivisions(homepageHtml, normalizedBaseUrl);
    const seasonMaps = [homepageSeasonMap];

    if (homepageSeasonMap.size === 0) {
        const [tablesHtml, fixturesHtml] = await Promise.all([
            fetchText(`${normalizedBaseUrl}/Tables`).catch(() => ''),
            fetchText(`${normalizedBaseUrl}/Fixtures`).catch(() => ''),
        ]);
        seasonMaps.push(
            collectTT365CurrentDivisions(tablesHtml, normalizedBaseUrl),
            collectTT365CurrentDivisions(fixturesHtml, normalizedBaseUrl),
        );
    }

    const merged = new Map<string, Map<string, string>>();
    for (const seasonMap of seasonMaps) {
        for (const [season, divisions] of seasonMap.entries()) {
            const target = merged.get(season) ?? new Map<string, string>();
            for (const [slug, name] of divisions.entries()) {
                target.set(slug, name);
            }
            merged.set(season, target);
        }
    }

    const selectedSeason = Array.from(merged.entries())
        .sort((a, b) => {
            const byDivisionCount = b[1].size - a[1].size;
            if (byDivisionCount !== 0) return byDivisionCount;
            return b[0].localeCompare(a[0]);
        })[0];

    if (!selectedSeason || selectedSeason[1].size === 0) {
        throw new Error('No current TT365 divisions were found');
    }

    let archiveSeasons = collectTT365ArchiveSeasons(homepageHtml, normalizedBaseUrl);
    if (archiveSeasons.size === 0) {
        archiveSeasons = collectTT365ArchiveSeasons(
            await fetchText(`${normalizedBaseUrl}/Results/Archive`).catch(() => ''),
            normalizedBaseUrl,
        );
    }
    const [seasonToken, divisionMap] = selectedSeason;
    const divisions = Array.from(divisionMap.entries())
        .map(([slug, name]) => ({
            name,
            season: seasonToken,
            slug,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        seasonName: seasonToken.replace(/_/g, ' '),
        seasonToken,
        seasonsAvailable: archiveSeasons.has(seasonToken)
            ? archiveSeasons.size
            : archiveSeasons.size + 1,
        divisions,
    };
}

async function verifyTTLeagues(baseUrl: string): Promise<TTLeaguesVerification> {
    const normalizedBaseUrl = normalizeUrl(baseUrl);
    const tenantHost = new URL(normalizedBaseUrl).host;
    const headers = {
        Tenant: tenantHost,
        Entry: '1',
    };

    const [competitions, archives] = await Promise.all([
        fetchJson<TTLeaguesCompetition[]>(`${TTL_API_BASE}/competitions`, headers),
        fetchJson<TTLeaguesCompetition[]>(`${TTL_API_BASE}/competitions/archives`, headers),
    ]);

    const nonCupCompetitions = competitions.filter((competition) => !CUP_NAME_PATTERN.test(competition.name));
    if (nonCupCompetitions.length === 0) {
        throw new Error('No active TT Leagues competitions were found');
    }

    const divisionsPerCompetition = await Promise.all(nonCupCompetitions.map(async (competition) => ({
        competition,
        divisions: await fetchJson<TTLeaguesDivision[]>(
            `${TTL_API_BASE}/competitions/${competition.id}/divisions`,
            headers,
        ),
    })));

    const selected = divisionsPerCompetition
        .filter((entry) => entry.divisions.length > 0)
        .sort((a, b) => {
            const byDivisionCount = b.divisions.length - a.divisions.length;
            if (byDivisionCount !== 0) return byDivisionCount;
            return b.competition.id - a.competition.id;
        })[0];

    if (!selected) {
        throw new Error('No active TT Leagues divisions were found');
    }

    return {
        seasonName: selected.competition.name,
        seasonsAvailable: nonCupCompetitions.length + archives.filter((competition) =>
            !CUP_NAME_PATTERN.test(competition.name),
        ).length,
        divisions: selected.divisions.map((division) => ({
            name: division.name || `Division ${division.id}`,
            divisionId: division.id,
        })),
    };
}

function buildTT365Config(candidate: CandidateLeague, url: string, verification: TT365Verification): LeagueConfigEntry {
    return {
        platform: 'tt365',
        leagueName: candidate.leagueName,
        externalId: `${pathSegmentFromUrl(url)}-tt365`,
        seasonName: verification.seasonName,
        seasonExtId: normalizeSlug(verification.seasonName),
        baseUrl: normalizeUrl(url),
        history: {
            enabled: verification.seasonsAvailable > 1,
            maxSeasons: 6,
        },
        divisions: verification.divisions,
        regions: [candidate.country, candidate.region],
    };
}

function buildTTLeaguesConfig(candidate: CandidateLeague, url: string, verification: TTLeaguesVerification): LeagueConfigEntry {
    return {
        platform: 'ttleagues',
        leagueName: candidate.leagueName,
        externalId: `${ttLeaguesSubdomain(url)}-ttl`,
        seasonName: verification.seasonName,
        seasonExtId: normalizeSlug(verification.seasonName),
        baseUrl: normalizeUrl(url),
        history: {
            enabled: verification.seasonsAvailable > 1,
            maxSeasons: 6,
            includeCups: false,
        },
        divisions: verification.divisions,
        regions: [candidate.country, candidate.region],
    };
}

async function verifyCandidate(candidate: CandidateLeague): Promise<VerifiedLeague> {
    const orderedLinks = orderLinks(candidate.links);
    const primaryLink = orderedLinks[0] ?? null;
    const supportedLinks = orderedLinks.filter((link) => {
        const platform = platformFromUrl(link.url);
        return platform === 'tt365' || platform === 'ttleagues';
    });

    const baseRow: ResearchRow = {
        country: candidate.country,
        region: candidate.region,
        league_name: candidate.leagueName,
        source_url: candidate.sourceUrl,
        official_url: primaryLink?.url ?? null,
        official_link_label: primaryLink?.label ?? null,
        active_platform: primaryLink ? platformFromUrl(primaryLink.url) : 'unknown',
        active_url: primaryLink?.url ?? null,
        scrape_status: 'unsupported_platform',
        current_season_name: null,
        current_divisions: null,
        seasons_available: null,
        notes: candidate.notes ?? '',
    };

    if (!primaryLink) {
        return {
            row: {
                ...baseRow,
                active_platform: 'unknown',
                scrape_status: 'no_public_results_url',
                notes: candidate.notes ?? 'No public results URL was published by the governing body source.',
            },
            config: null,
        };
    }

    const failureNotes: string[] = [];

    for (const link of supportedLinks) {
        const platform = platformFromUrl(link.url);
        try {
            if (platform === 'tt365') {
                const verification = await verifyTT365(link.url);
                return {
                    row: {
                        ...baseRow,
                        official_url: link.url,
                        official_link_label: link.label,
                        active_platform: platform,
                        active_url: link.url,
                        scrape_status: 'ready',
                        current_season_name: verification.seasonName,
                        current_divisions: verification.divisions.length,
                        seasons_available: verification.seasonsAvailable,
                        notes: candidate.notes
                            ?? (link === primaryLink
                                ? 'Verified against the live TT365 tables and archive pages.'
                                : `Verified against the live TT365 tables and archive pages via the ${link.label.toLowerCase()} link.`),
                    },
                    config: buildTT365Config(candidate, link.url, verification),
                };
            }

            if (platform === 'ttleagues') {
                const verification = await verifyTTLeagues(link.url);
                return {
                    row: {
                        ...baseRow,
                        official_url: link.url,
                        official_link_label: link.label,
                        active_platform: platform,
                        active_url: link.url,
                        scrape_status: 'ready',
                        current_season_name: verification.seasonName,
                        current_divisions: verification.divisions.length,
                        seasons_available: verification.seasonsAvailable,
                        notes: candidate.notes
                            ?? (link === primaryLink
                                ? 'Verified against the live TT Leagues competitions and divisions APIs.'
                                : `Verified against the live TT Leagues competitions and divisions APIs via the ${link.label.toLowerCase()} link.`),
                    },
                    config: buildTTLeaguesConfig(candidate, link.url, verification),
                };
            }
        } catch (error) {
            failureNotes.push(`${link.label}: ${(error as Error).message}`);
        }
    }

    if (supportedLinks.length > 0) {
        const firstSupportedLink = supportedLinks[0]!;
        return {
            row: {
                ...baseRow,
                official_url: firstSupportedLink.url,
                official_link_label: firstSupportedLink.label,
                active_platform: platformFromUrl(firstSupportedLink.url),
                active_url: firstSupportedLink.url,
                scrape_status: 'inactive_or_unverified',
                notes: `${candidate.notes ? `${candidate.notes} ` : ''}${failureNotes.join(' | ')}`,
            },
            config: null,
        };
    }

    return {
        row: {
            ...baseRow,
            scrape_status: 'unsupported_platform',
            notes: candidate.notes
                ?? 'Official link points to a custom website rather than TT365 or TT Leagues.',
        },
        config: null,
    };
}

async function runWithConcurrency<T, R>(
    items: T[],
    worker: (item: T) => Promise<R>,
    concurrency: number,
): Promise<R[]> {
    const results: R[] = [];
    let index = 0;

    async function next(): Promise<void> {
        const currentIndex = index++;
        if (currentIndex >= items.length) return;
        results[currentIndex] = await worker(items[currentIndex]!);
        await next();
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
    return results;
}

function csvEscape(value: string | number | null): string {
    if (value === null) return '';
    const text = String(value);
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows: ResearchRow[]): string {
    const headers = [
        'country',
        'region',
        'league_name',
        'source_url',
        'official_url',
        'official_link_label',
        'active_platform',
        'active_url',
        'scrape_status',
        'current_season_name',
        'current_divisions',
        'seasons_available',
        'notes',
    ];

    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push([
            row.country,
            row.region,
            row.league_name,
            row.source_url,
            row.official_url,
            row.official_link_label,
            row.active_platform,
            row.active_url,
            row.scrape_status,
            row.current_season_name,
            row.current_divisions,
            row.seasons_available,
            row.notes,
        ].map(csvEscape).join(','));
    }
    return `${lines.join('\n')}\n`;
}

function buildMarkdown(rows: ResearchRow[], generatedCount: number): string {
    const summary = new Map<string, { ready: number; blocked: number }>();
    for (const row of rows) {
        const countrySummary = summary.get(row.country) ?? { ready: 0, blocked: 0 };
        if (row.scrape_status === 'ready') {
            countrySummary.ready += 1;
        } else {
            countrySummary.blocked += 1;
        }
        summary.set(row.country, countrySummary);
    }

    const readyRows = rows.filter((row) => row.scrape_status === 'ready');
    const blockedRows = rows.filter((row) => row.scrape_status !== 'ready');

    const summaryLines = Array.from(summary.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([country, counts]) => `| ${country} | ${counts.ready} | ${counts.blocked} |`)
        .join('\n');

    const readyLines = readyRows
        .slice(0, 40)
        .map((row) => `| ${row.country} | ${row.region} | ${row.league_name} | ${row.active_platform} | ${row.active_url} | ${row.current_divisions ?? ''} | ${row.seasons_available ?? ''} |`)
        .join('\n');

    const blockedLines = blockedRows
        .slice(0, 40)
        .map((row) => `| ${row.country} | ${row.region} | ${row.league_name} | ${row.scrape_status} | ${row.official_url ?? ''} | ${row.notes} |`)
        .join('\n');

    return [
        '# UK League Expansion Research',
        '',
        `Generated on ${REPORT_DATE}.`,
        '',
        '## Sources',
        '',
        `- England directory: ${ENGLAND_DIRECTORY_URL}`,
        `- Wales TT Leagues page: ${WALES_DIRECTORY_URL}`,
        `- TT365 Sites sitemap: ${TT365_SITES_URL}`,
        `- Table Tennis Ulster leagues page: ${TT_ULSTER_LEAGUES_URL}`,
        '',
        '## Summary',
        '',
        `- Scrape-ready league configs generated: ${generatedCount}`,
        `- Detailed verified dataset: \`docs/uk-league-research-${REPORT_DATE}.csv\``,
        `- Generated worker config: \`apps/worker/config/uk-leagues.generated.json\``,
        '',
        '| Country | Ready | Blocked |',
        '| --- | ---: | ---: |',
        summaryLines,
        '',
        '## Sample Ready Rows',
        '',
        '| Country | Region | League | Platform | URL | Divisions | Seasons |',
        '| --- | --- | --- | --- | --- | ---: | ---: |',
        readyLines || '| None | None | None | None | None | 0 | 0 |',
        '',
        '## Sample Blocked Rows',
        '',
        '| Country | Region | League | Status | Official URL | Notes |',
        '| --- | --- | --- | --- | --- | --- |',
        blockedLines || '| None | None | None | None | None | None |',
        '',
        'Full detail is in the CSV file; the markdown intentionally truncates the row lists for readability.',
        '',
    ].join('\n');
}

async function main(): Promise<void> {
    const [englandHtml, walesHtml] = await Promise.all([
        fetchText(ENGLAND_DIRECTORY_URL),
        fetchText(WALES_DIRECTORY_URL),
    ]);

    const candidates = [
        ...parseEnglandDirectory(englandHtml),
        ...parseWalesDirectory(walesHtml),
        ...manualScottishCandidates(),
    ];

    const verified = await runWithConcurrency(candidates, verifyCandidate, 8);
    const rows = [
        ...verified.map((item) => item.row),
        ...manualNorthernIrelandRows().map((item) => item.row),
    ].sort((a, b) =>
        a.country.localeCompare(b.country)
        || a.region.localeCompare(b.region)
        || a.league_name.localeCompare(b.league_name),
    );

    const generatedConfig = verified
        .flatMap((item) => (item.config ? [item.config] : []))
        .sort((a, b) =>
            a.regions[0]!.localeCompare(b.regions[0]!)
            || a.regions[1]!.localeCompare(b.regions[1]!)
            || a.leagueName.localeCompare(b.leagueName),
        );

    await mkdir(DOCS_DIR, { recursive: true });
    await mkdir(CONFIG_DIR, { recursive: true });

    await writeFile(
        resolve(DOCS_DIR, `uk-league-research-${REPORT_DATE}.csv`),
        buildCsv(rows),
        'utf8',
    );

    await writeFile(
        resolve(DOCS_DIR, `uk-league-expansion-report-${REPORT_DATE}.md`),
        buildMarkdown(rows, generatedConfig.length),
        'utf8',
    );

    await writeFile(
        resolve(CONFIG_DIR, 'uk-leagues.generated.json'),
        `${JSON.stringify(generatedConfig, null, 4)}\n`,
        'utf8',
    );

    console.log(`Generated ${generatedConfig.length} scrape-ready configs`);
    console.log(`Report rows: ${rows.length}`);
}

void main();
