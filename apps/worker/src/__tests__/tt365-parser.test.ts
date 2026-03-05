import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
    ParsedTeam,
    ParsedPlayer,
    ParsedFixture,
    ParsedRubber,
    ParsedStanding,
    ParsedTTLeaguesData,
} from '../parser.js';

// ─── Load HTML Fixture Files ──────────────────────────────────────────────────

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

const standingsHtml = readFileSync(
    join(FIXTURES_DIR, 'tt365_standings.html'),
    'utf-8',
);
const matchCardHtml = readFileSync(
    join(FIXTURES_DIR, 'tt365_matchcard.html'),
    'utf-8',
);
const matchCardAjaxHtml = readFileSync(
    join(FIXTURES_DIR, 'tt365_matchcard_ajax.html'),
    'utf-8',
);
const fixturesHtml = readFileSync(
    join(FIXTURES_DIR, 'tt365_fixtures.html'),
    'utf-8',
);

// ─── The module-under-test will be ../../tt365-parser.ts ──────────────────────
// It will export:
//   parseTT365Standings(html: string): { teams: ParsedTeam[]; standings: ParsedStanding[] }
//   parseTT365MatchCard(html: string, matchExternalId: string): {
//       teams: ParsedTeam[];
//       players: ParsedPlayer[];
//       fixture: ParsedFixture;
//       rubbers: ParsedRubber[];
//   }

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('TT365 Cheerio Parser', () => {
    // ── Standings Parser ──────────────────────────────────────────────────────

    describe('parseTT365Standings()', () => {
        let result: { teams: ParsedTeam[]; standings: ParsedStanding[] };

        beforeAll(async () => {
            const { parseTT365Standings } = await import('../tt365-parser.js');
            result = parseTT365Standings(standingsHtml);
        });

        it('should extract exactly 5 teams from the standings table', () => {
            expect(result.teams).toHaveLength(5);
        });

        it('should extract team names correctly', () => {
            const names = result.teams.map((t) => t.name).sort();
            expect(names).toEqual([
                'Billericay A',
                'Billericay B',
                'Buttsbury B',
                'Buttsbury C',
                'Navestock A',
            ]);
        });

        it('should use the URL slug as team externalId', () => {
            const buttsburyB = result.teams.find((t) => t.name === 'Buttsbury B');
            expect(buttsburyB).toBeTruthy();
            expect(buttsburyB!.externalId).toBe('Buttsbury_B');
        });

        it('should extract exactly 5 standings entries', () => {
            expect(result.standings).toHaveLength(5);
        });

        it('should extract position, played, won, drawn, lost, and points correctly', () => {
            const first = result.standings.find((s) => s.position === 1);
            expect(first).toBeTruthy();
            expect(first).toMatchObject({
                teamExternalId: 'Buttsbury_B',
                position: 1,
                played: 16,
                won: 14,
                drawn: 0,
                lost: 2,
                points: 118,
            });
        });

        it('should extract all standings with correct positions in order', () => {
            const positions = result.standings.map((s) => s.position).sort((a, b) => a - b);
            expect(positions).toEqual([1, 2, 3, 4, 5]);
        });

        it('should extract the last-place team correctly', () => {
            const last = result.standings.find((s) => s.position === 5);
            expect(last).toMatchObject({
                teamExternalId: 'Navestock_A',
                position: 5,
                played: 15,
                won: 6,
                drawn: 1,
                lost: 8,
                points: 67,
            });
        });
    });

    // ── Fixtures Page Parser ────────────────────────────────────────────────

    describe('parseTT365FixtureMatchCards()', () => {
        const FIXTURES_PAGE_URL =
            'https://www.tabletennis365.com/Brentwood/Fixtures/Winter_2025/Premier_Division';

        it('should extract unique match-card targets from the fixtures page', async () => {
            const { parseTT365FixtureMatchCards } = await import('../tt365-parser.js');

            const targets = parseTT365FixtureMatchCards(fixturesHtml, FIXTURES_PAGE_URL);

            expect(targets).toHaveLength(2);
            expect(targets).toEqual([
                {
                    matchExternalId: '448193',
                    url: 'https://www.tabletennis365.com/Brentwood/Results/Winter_2025/Premier_Division/MatchCard/448193',
                },
                {
                    matchExternalId: '448195',
                    url: 'https://www.tabletennis365.com/Brentwood/Results/Winter_2025/Premier_Division/MatchCard/448195',
                },
            ]);
        });

        it('should return an empty array when there are no match-card links', async () => {
            const { parseTT365FixtureMatchCards } = await import('../tt365-parser.js');

            const targets = parseTT365FixtureMatchCards('<html><body><div id="Fixtures"></div></body></html>', FIXTURES_PAGE_URL);

            expect(targets).toEqual([]);
        });
    });

    // ── Match Card Parser ─────────────────────────────────────────────────────

    describe('parseTT365MatchCard()', () => {
        const MATCH_ID = '458829';
        let result: {
            teams: ParsedTeam[];
            players: ParsedPlayer[];
            fixture: ParsedFixture;
            rubbers: ParsedRubber[];
        };

        beforeAll(async () => {
            const { parseTT365MatchCard } = await import('../tt365-parser.js');
            result = parseTT365MatchCard(matchCardHtml, MATCH_ID);
        });

        // ── Teams ─────────────────────────────────────────────────────────────

        it('should extract exactly 2 teams (home & away)', () => {
            expect(result.teams).toHaveLength(2);
        });

        it('should extract team names from the fixture header', () => {
            const names = result.teams.map((t) => t.name).sort();
            expect(names).toEqual(['Billericay B', 'Navestock A']);
        });

        it('should use URL slugs as team externalIds', () => {
            const home = result.teams.find((t) => t.name === 'Billericay B');
            expect(home!.externalId).toBe('Billericay_B');
        });

        // ── Players ───────────────────────────────────────────────────────────

        it('should extract exactly 5 unique players (3 home + 2 away, forfeits excluded)', () => {
            // Home: Arron Chandler, Gary Ward, John Parodi
            // Away: Bajraktari Indrit, Rick Klein  (3 forfeits have no player link)
            expect(result.players).toHaveLength(5);
        });

        it('should extract player names correctly', () => {
            const names = result.players.map((p) => p.name).sort();
            expect(names).toEqual([
                'Arron Chandler',
                'Bajraktari Indrit',
                'Gary Ward',
                'John Parodi',
                'Rick Klein',
            ]);
        });

        it('should use the player URL path segment as externalId (slug/numericId)', () => {
            const arron = result.players.find((p) => p.name === 'Arron Chandler');
            expect(arron).toBeTruthy();
            // The URL is /Brentwood/Results/Player/Statistics/Winter_2025/Arron_Chandler/401745
            // externalId should be the numeric ID or the full slug — we use the numeric part
            expect(arron!.externalId).toBe('401745');
        });

        // ── Fixture ───────────────────────────────────────────────────────────

        it('should produce a single fixture with the provided matchExternalId', () => {
            expect(result.fixture.externalId).toBe(MATCH_ID);
        });

        it('should correctly identify home and away team external IDs', () => {
            expect(result.fixture.homeTeamExternalId).toBe('Billericay_B');
            expect(result.fixture.awayTeamExternalId).toBe('Navestock_A');
        });

        it('should extract the match date as an ISO date string', () => {
            // <time datetime="2026-04-13"> → '2026-04-13'
            expect(result.fixture.datePlayed).toBe('2026-04-13');
        });

        it('should derive status as "completed" (scores are present)', () => {
            expect(result.fixture.status).toBe('completed');
        });

        // ── Rubbers ───────────────────────────────────────────────────────────

        it('should extract exactly 10 rubbers (excluding the summary row)', () => {
            expect(result.rubbers).toHaveLength(10);
        });

        it('should assign sequential externalIds based on row index', () => {
            // Since TT365 has no rubber ID, we derive it from matchId + row index
            expect(result.rubbers[0].externalId).toBe('458829-1');
            expect(result.rubbers[9].externalId).toBe('458829-10');
        });

        it('should set matchExternalId on every rubber', () => {
            for (const rubber of result.rubbers) {
                expect(rubber.matchExternalId).toBe(MATCH_ID);
            }
        });

        it('should detect 3 walkover rubbers (forfeits)', () => {
            const walkovers = result.rubbers.filter((r) => r.outcomeType === 'walkover');
            expect(walkovers).toHaveLength(3);
        });

        it('should detect 7 normal rubbers', () => {
            const normals = result.rubbers.filter((r) => r.outcomeType === 'normal');
            expect(normals).toHaveLength(7);
        });

        it('should detect exactly 1 doubles rubber (the last one)', () => {
            const doublesRubbers = result.rubbers.filter((r) => r.isDoubles);
            expect(doublesRubbers).toHaveLength(1);

            const doubles = doublesRubbers[0];
            expect(doubles.homePlayers).toHaveLength(2);
            expect(doubles.awayPlayers).toHaveLength(2);
            expect(doubles.externalId).toBe('458829-10');
        });

        it('should correctly parse the set score for a normal singles rubber', () => {
            // Rubber 2: Gary Ward vs Bajraktari Indrit → Score 1-0
            const rubber2 = result.rubbers[1];
            expect(rubber2.homeGamesWon).toBe(1);
            expect(rubber2.awayGamesWon).toBe(0);
            expect(rubber2.outcomeType).toBe('normal');
        });

        it('should correctly parse a loss for the home player', () => {
            // Rubber 3: John Parodi vs Rick Klein → Score 0-1
            const rubber3 = result.rubbers[2];
            expect(rubber3.homeGamesWon).toBe(0);
            expect(rubber3.awayGamesWon).toBe(1);
        });

        it('should correctly parse the doubles rubber score', () => {
            // Rubber 10: Chandler/Ward vs Bajraktari/Klein → Score 0-1
            const doubles = result.rubbers[9];
            expect(doubles.isDoubles).toBe(true);
            expect(doubles.homeGamesWon).toBe(0);
            expect(doubles.awayGamesWon).toBe(1);
        });

        it('should use player externalIds (numeric IDs) in rubber homePlayers/awayPlayers arrays', () => {
            // Rubber 2: Gary Ward (395890) vs Bajraktari Indrit (400934)
            const rubber2 = result.rubbers[1];
            expect(rubber2.homePlayers).toEqual(['395890']);
            expect(rubber2.awayPlayers).toEqual(['400934']);
        });

        it('should set empty awayPlayers array for forfeit rubbers', () => {
            // Rubber 1: Arron Chandler vs Forfeit
            const forfeit = result.rubbers[0];
            expect(forfeit.outcomeType).toBe('walkover');
            expect(forfeit.homePlayers).toEqual(['401745']);
            expect(forfeit.awayPlayers).toEqual([]);
        });

        it('should list both player IDs in the doubles rubber', () => {
            const doubles = result.rubbers[9];
            expect(doubles.homePlayers).toEqual(['401745', '395890']); // Chandler, Ward
            expect(doubles.awayPlayers).toEqual(['400934', '395882']); // Bajraktari, Klein
        });
    });

    describe('parseTT365MatchCard() - AJAX variant', () => {
        it('should parse teams and rubbers from TT365 AJAX fragment markup', async () => {
            const { parseTT365MatchCard } = await import('../tt365-parser.js');

            const result = parseTT365MatchCard(matchCardAjaxHtml, '448193');

            expect(result.fixture.externalId).toBe('448193');
            expect(result.fixture.homeTeamExternalId).toBe('Billericay_A');
            expect(result.fixture.awayTeamExternalId).toBe('Brentwood_A');
            expect(result.fixture.datePlayed).toBe('2025-09-08');
            expect(result.fixture.status).toBe('completed');

            expect(result.rubbers).toHaveLength(1);
            expect(result.rubbers[0].externalId).toBe('448193-1');
            expect(result.rubbers[0].homePlayers).toEqual(['395865']);
            expect(result.rubbers[0].awayPlayers).toEqual(['395870']);
        });
    });
});
