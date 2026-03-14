import * as cheerio from 'cheerio';
import type { FixtureStatus, OutcomeType } from '@tt-players/db';
import type {
    ParsedTeam,
    ParsedPlayer,
    ParsedFixture,
    ParsedRubber,
    ParsedStanding,
} from './parser.js';

/**
 * Collapse internal whitespace (newlines, tabs, multiple spaces) into a single space.
 */
function normalizeText(raw: string): string {
    return raw.replace(/\s+/g, ' ').trim();
}

function isForfeitCellText(text: string): boolean {
    return normalizeText(text).toLowerCase().includes('forfeit');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the last two segments of a TT365 player URL as the external ID.
 * URL pattern: /Brentwood/Results/Player/Statistics/Winter_2025/Arron_Chandler/401745
 * Returns the numeric ID (last segment), e.g. '401745'.
 */
function extractPlayerIdFromHref(href: string): string {
    const segments = href.replace(/\/$/, '').split('/');
    // Last segment is the numeric ID
    return segments[segments.length - 1];
}

/**
 * Extract team slug from a TT365 team URL.
 * URL pattern: /Brentwood/Results/Team/Statistics/Winter_2025/Premier_Division/Billericay_B
 * Returns the last segment, e.g. 'Billericay_B'.
 */
function extractTeamSlugFromHref(href: string): string {
    const segments = href.replace(/\/$/, '').split('/');
    return segments[segments.length - 1];
}

/**
 * Extract TT365 numeric match ID from a MatchCard URL path.
 * URL pattern: /Brentwood/Results/Winter_2025/Premier_Division/MatchCard/458829
 */
function extractMatchIdFromHref(href: string): string | null {
    const match = href.match(/\/matchcard\/(\d+)(?:[/?#]|$)/i);
    return match?.[1] ?? null;
}

/**
 * Parse TT365 game-by-game scores and return won game counts.
 * Input examples:
 * - "11-9 9-11 11-7 11-8"
 * - "<div>11-9</div><div>9-11</div>..."
 */
function parseGameCountsFromCellText(cellText: string): { homeGamesWon: number; awayGamesWon: number } | null {
    const gamePattern = /(\d+)\s*-\s*(\d+)/g;
    let homeGamesWon = 0;
    let awayGamesWon = 0;
    let gameCount = 0;
    const winningGames = 3;

    for (const match of cellText.matchAll(gamePattern)) {
        const home = parseInt(match[1], 10);
        const away = parseInt(match[2], 10);
        if (Number.isNaN(home) || Number.isNaN(away)) continue;
        gameCount += 1;
        if (home > away) homeGamesWon += 1;
        else if (away > home) awayGamesWon += 1;

        // TT365 can include extra trailing game tokens in some cards; treat rubbers as first-to-3.
        if (homeGamesWon >= winningGames || awayGamesWon >= winningGames) {
            break;
        }
    }

    if (gameCount === 0) return null;
    return { homeGamesWon, awayGamesWon };
}

// ─── Standings Parser ─────────────────────────────────────────────────────────

export function parseTT365Standings(html: string): {
    teams: ParsedTeam[];
    standings: ParsedStanding[];
} {
    const $ = cheerio.load(html);

    const teams: ParsedTeam[] = [];
    const standings: ParsedStanding[] = [];
    const seenTeams = new Set<string>();

    // The standings table has columns: #, Team, P, W, D, L, SF, SA, Points
    $('table tbody tr').each((_i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 9) return; // skip non-data rows

        const position = parseInt($(cells[0]).text().trim(), 10);
        if (isNaN(position)) return; // skip header/footer rows

        // Team cell contains an <a> with the team name and URL slug
        const teamLink = $(cells[1]).find('a').first();
        const teamName = normalizeText(teamLink.text());
        const teamHref = teamLink.attr('href') || '';
        const teamSlug = extractTeamSlugFromHref(teamHref);

        if (!seenTeams.has(teamSlug)) {
            seenTeams.add(teamSlug);
            teams.push({
                externalId: teamSlug,
                name: teamName,
            });
        }

        standings.push({
            teamExternalId: teamSlug,
            position,
            played: parseInt($(cells[2]).text().trim(), 10),
            won: parseInt($(cells[3]).text().trim(), 10),
            drawn: parseInt($(cells[4]).text().trim(), 10),
            lost: parseInt($(cells[5]).text().trim(), 10),
            // cells[6] = SF, cells[7] = SA (skipped, not in ParsedStanding)
            points: parseInt($(cells[8]).text().trim(), 10),
        });
    });

    return { teams, standings };
}

// ─── Fixtures Page Parser ────────────────────────────────────────────────────

export interface TT365MatchCardTarget {
    matchExternalId: string;
    url: string;
}

export interface TT365PlayerStatsTarget {
    playerExternalId: string;
    seasonToken: string;
    url: string;
}

export interface TT365PlayerMatchResult {
    opponentExternalId: string;
    matchDate: string | null;
    playerGamesWon: number;
    opponentGamesWon: number;
}

export function parseTT365FixtureMatchCards(
    html: string,
    fixturesPageUrl: string,
): TT365MatchCardTarget[] {
    const $ = cheerio.load(html);

    const seenMatchIds = new Set<string>();
    const targets: TT365MatchCardTarget[] = [];

    // Scope to the fixtures container and pull every MatchCard link.
    $('#Fixtures a[href*="/MatchCard/"], #Fixtures a[href*="/matchcard/"]').each((_i, a) => {
        const href = $(a).attr('href');
        if (!href) return;

        const matchExternalId = extractMatchIdFromHref(href);
        if (!matchExternalId || seenMatchIds.has(matchExternalId)) return;

        const url = new URL(href, fixturesPageUrl).toString();
        seenMatchIds.add(matchExternalId);
        targets.push({ matchExternalId, url });
    });

    return targets;
}

function extractSeasonTokenFromPlayerStatsHref(href: string): string | null {
    const match = href.match(/\/results\/player\/statistics\/([^/]+)\//i);
    return match?.[1] ?? null;
}

export function parseTT365PlayerStatsTargets(
    html: string,
    matchCardUrl: string,
): TT365PlayerStatsTarget[] {
    const $ = cheerio.load(html);

    const targets: TT365PlayerStatsTarget[] = [];
    const seenPlayerIds = new Set<string>();

    $('a[href*="/Results/Player/Statistics/"], a[href*="/results/player/statistics/"]').each(
        (_i, a) => {
            const href = $(a).attr('href');
            if (!href) return;

            const playerExternalId = extractPlayerIdFromHref(href);
            const seasonToken = extractSeasonTokenFromPlayerStatsHref(href);
            if (!playerExternalId || !seasonToken || seenPlayerIds.has(playerExternalId)) {
                return;
            }

            seenPlayerIds.add(playerExternalId);
            targets.push({
                playerExternalId,
                seasonToken,
                url: new URL(href, matchCardUrl).toString(),
            });
        },
    );

    return targets;
}

export function parseTT365PlayerResultsForMatch(
    html: string,
    matchExternalId: string,
): TT365PlayerMatchResult[] {
    const $ = cheerio.load(html);

    const results: TT365PlayerMatchResult[] = [];

    $('table tbody tr').each((_i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 6) return;

        const resultLink = $(cells[cells.length - 1]).find(
            'a[href*="/MatchCard/"], a[href*="/matchcard/"]',
        ).first();
        const resultHref = resultLink.attr('href') ?? '';
        const rowMatchExternalId = extractMatchIdFromHref(resultHref);
        if (rowMatchExternalId !== matchExternalId) return;

        const opponentLink = $(cells[0]).find(
            'a[href*="/Results/Player/Statistics/"], a[href*="/results/player/statistics/"]',
        ).first();
        const opponentHref = opponentLink.attr('href') ?? '';
        const opponentExternalId = extractPlayerIdFromHref(opponentHref);
        if (!opponentExternalId) return;

        const matchDate = normalizeText($(row).find('time[datetime]').first().attr('datetime') ?? '') || null;

        const gamesCell = $(cells[cells.length - 2]);
        const gameSpans = gamesCell.find('.game').toArray();
        const gamesCellText = gameSpans.length > 0
            ? gameSpans.map((el) => normalizeText($(el).text())).join(' ')
            : normalizeText(gamesCell.text());
        const parsedGames = parseGameCountsFromCellText(gamesCellText);
        let playerGamesWon = parsedGames?.homeGamesWon ?? 0;
        let opponentGamesWon = parsedGames?.awayGamesWon ?? 0;

        // Rare fallback: some rows can have no per-game spans but still indicate win/loss.
        if (!parsedGames) {
            const resultText = normalizeText(resultLink.text()).toLowerCase();
            if (resultText === 'win') {
                playerGamesWon = 1;
                opponentGamesWon = 0;
            } else if (resultText === 'loss') {
                playerGamesWon = 0;
                opponentGamesWon = 1;
            }
        }

        results.push({
            opponentExternalId,
            matchDate,
            playerGamesWon,
            opponentGamesWon,
        });
    });

    return results;
}

// ─── Match Card Parser ────────────────────────────────────────────────────────

export function parseTT365MatchCard(
    html: string,
    matchExternalId: string,
): {
    teams: ParsedTeam[];
    players: ParsedPlayer[];
    fixture: ParsedFixture;
    rubbers: ParsedRubber[];
} {
    const $ = cheerio.load(html);

    // ── Extract teams from the fixture header ─────────────────────────────
    // TT365 has at least two variants:
    // 1) static .fixture-header (used in local fixtures)
    // 2) ajax fragment under #CardSummary .teamNames
    let teamLinks = $('.fixture-header').find('a');
    if (teamLinks.length < 2) {
        teamLinks = $('#CardSummary .teamNames a');
    }

    const homeTeamName = normalizeText($(teamLinks[0]).text());
    const homeTeamHref = $(teamLinks[0]).attr('href') || '';
    const homeTeamSlug = extractTeamSlugFromHref(homeTeamHref);

    const awayTeamName = normalizeText($(teamLinks[1]).text());
    const awayTeamHref = $(teamLinks[1]).attr('href') || '';
    const awayTeamSlug = extractTeamSlugFromHref(awayTeamHref);

    const teams: ParsedTeam[] = [
        { externalId: homeTeamSlug, name: homeTeamName },
        { externalId: awayTeamSlug, name: awayTeamName },
    ];

    // ── Extract the match date ────────────────────────────────────────────
    const timeEl = $('time[datetime]');
    const datePlayed = timeEl.attr('datetime') || '';

    // ── Extract rubbers and players from the match table ──────────────────
    const playerMap = new Map<string, ParsedPlayer>(); // keyed by externalId
    const rubbers: ParsedRubber[] = [];

    $('table tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 4) return;

        // Skip the summary row at the bottom (has colspan or "Submitted By" text)
        const firstCell = $(cells[0]);
        if (firstCell.attr('colspan') || firstCell.text().includes('Submitted By')) {
            return;
        }

        const rubberIndex = rubbers.length + 1;

        // ── Home player(s) ────────────────────────────────────────────────
        const homeCell = $(cells[0]);
        const homePlayerLinks = homeCell.find('a');
        const homePlayers: string[] = [];
        let homeIsForfeit = false;
        homePlayerLinks.each((_j, a) => {
            const href = $(a).attr('href') || '';
            const name = normalizeText($(a).text());
            const extId = extractPlayerIdFromHref(href);
            homePlayers.push(extId);
            if (!playerMap.has(extId)) {
                playerMap.set(extId, { externalId: extId, name });
            }
        });
        if (homePlayerLinks.length === 0 && isForfeitCellText(homeCell.text())) {
            homeIsForfeit = true;
        }

        // ── Away player(s) ────────────────────────────────────────────────
        const awayCell = $(cells[1]);
        const awayPlayerLinks = awayCell.find('a');
        const awayPlayers: string[] = [];
        let awayIsForfeit = false;

        if (awayPlayerLinks.length === 0) {
            if (isForfeitCellText(awayCell.text())) {
                awayIsForfeit = true;
            }
        } else {
            awayPlayerLinks.each((_j, a) => {
                const href = $(a).attr('href') || '';
                const name = normalizeText($(a).text());
                const extId = extractPlayerIdFromHref(href);
                awayPlayers.push(extId);
                if (!playerMap.has(extId)) {
                    playerMap.set(extId, { externalId: extId, name });
                }
            });
        }

        // ── Score ─────────────────────────────────────────────────────────
        // TT365 "Score" is winner points (1-0/0-1); the "Games" column carries set-level detail.
        // We parse game counts from Games first, then fallback to Score if Games cannot be parsed.
        const gamesCellText = normalizeText($(cells[2]).text());
        const parsedGames = parseGameCountsFromCellText(gamesCellText);
        const scoreText = normalizeText($(cells[3]).text()); // fallback (e.g. "1-0")
        const scoreParts = scoreText.split('-').map((s) => parseInt(s.trim(), 10));
        const homeGamesWon = parsedGames?.homeGamesWon ?? scoreParts[0] ?? 0;
        const awayGamesWon = parsedGames?.awayGamesWon ?? scoreParts[1] ?? 0;

        // ── Doubles detection ─────────────────────────────────────────────
        const isDoubles = homePlayers.length > 1 || awayPlayers.length > 1;

        // ── Outcome type ──────────────────────────────────────────────────
        const isForfeit = homeIsForfeit || awayIsForfeit;
        const outcomeType: OutcomeType = isForfeit ? 'walkover' : 'normal';

        rubbers.push({
            externalId: `${matchExternalId}-${rubberIndex}`,
            matchExternalId,
            isDoubles,
            homePlayers,
            awayPlayers,
            homeGamesWon,
            awayGamesWon,
            outcomeType,
        });
    });

    // ── Build fixture ─────────────────────────────────────────────────────
    const hasScores = rubbers.length > 0;
    const status: FixtureStatus = hasScores ? 'completed' : 'upcoming';

    const fixture: ParsedFixture = {
        externalId: matchExternalId,
        homeTeamExternalId: homeTeamSlug,
        awayTeamExternalId: awayTeamSlug,
        datePlayed,
        status,
        roundName: null,
        roundOrder: null,
    };

    return {
        teams,
        players: Array.from(playerMap.values()),
        fixture,
        rubbers,
    };
}
