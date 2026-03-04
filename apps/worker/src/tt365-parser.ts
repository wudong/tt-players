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
    const fixtureHeader = $('.fixture-header');
    const teamLinks = fixtureHeader.find('a');

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
        const homePlayerLinks = $(cells[0]).find('a');
        const homePlayers: string[] = [];
        homePlayerLinks.each((_j, a) => {
            const href = $(a).attr('href') || '';
            const name = normalizeText($(a).text());
            const extId = extractPlayerIdFromHref(href);
            homePlayers.push(extId);
            if (!playerMap.has(extId)) {
                playerMap.set(extId, { externalId: extId, name });
            }
        });

        // ── Away player(s) ────────────────────────────────────────────────
        const awayPlayerLinks = $(cells[1]).find('a');
        const awayPlayers: string[] = [];
        let isForfeit = false;

        if (awayPlayerLinks.length === 0) {
            // Check for forfeit
            const cellText = normalizeText($(cells[1]).text()).toLowerCase();
            if (cellText.includes('forfeit')) {
                isForfeit = true;
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
        const scoreText = $(cells[3]).text().trim(); // e.g. "1-0" or "0-1"
        const scoreParts = scoreText.split('-').map((s) => parseInt(s.trim(), 10));
        const homeGamesWon = scoreParts[0] || 0;
        const awayGamesWon = scoreParts[1] || 0;

        // ── Doubles detection ─────────────────────────────────────────────
        const isDoubles = homePlayers.length > 1 || awayPlayers.length > 1;

        // ── Outcome type ──────────────────────────────────────────────────
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
