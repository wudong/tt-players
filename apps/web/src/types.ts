// Types matching the Fastify API response shapes exactly.

// --- /competitions/:id/standings ---
export interface StandingItem {
    position: number;
    team_id: string;
    team_name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
}

export interface StandingsResponse {
    data: StandingItem[];
}

// --- /teams/:id/fixtures ---
export type FixtureStatus = 'upcoming' | 'completed' | 'postponed';

export interface FixtureItem {
    id: string;
    competition_id: string;
    external_id: string;
    home_team_id: string | null;
    away_team_id: string | null;
    date_played: string;
    status: FixtureStatus;
    round_name: string | null;
    round_order: number | null;
}

export interface FixturesResponse {
    total: number;
    limit: number;
    offset: number;
    data: FixtureItem[];
}

// --- /players/:id/stats ---
export interface PlayerStats {
    player_id: string;
    player_name: string;
    wins: number;
    losses: number;
    total: number;
}

// Derived helper
export function winPercentage(stats: Pick<PlayerStats, 'wins' | 'total'>): number {
    if (stats.total === 0) return 0;
    return Math.round((stats.wins / stats.total) * 100);
}

// --- New Endpoints ---

export interface PlayerSearchItem {
    id: string;
    name: string;
    played: number;
    wins: number;
}

export interface PlayerSearchResponse {
    data: PlayerSearchItem[];
}

export interface ExtendedPlayerStats extends PlayerStats {
    nemesis: string;
    duo: string;
    streak: string;
}

export interface RubberItem {
    id: string;
    fixture_id: string;
    date: string;
    league: string;
    opponent: string;
    result: string;
    isWin: boolean;
}

export interface RubbersResponse {
    data: RubberItem[];
}

export interface H2HResponse {
    player1_wins: number;
    player2_wins: number;
    encounters: RubberItem[];
}

export interface RosterItem {
    id: string;
    name: string;
    played: number;
    winRate: number;
    wins: number;
}

export interface RosterResponse {
    data: RosterItem[];
}

export interface TeamFormResponse {
    form: string[];
    position: number | null;
    points: number | null;
}

export interface FixtureRubberItem {
    id: string;
    fixture_id: string;
    is_doubles: boolean;
    home_player_1_id: string | null;
    home_player_2_id: string | null;
    away_player_1_id: string | null;
    away_player_2_id: string | null;
    home_player_1_name: string | null;
    home_player_2_name: string | null;
    away_player_1_name: string | null;
    away_player_2_name: string | null;
    home_games_won: number;
    away_games_won: number;
}

export interface FixtureRubbersResponse {
    data: FixtureRubberItem[];
}

// Leagues
export interface LeagueItem {
    id: string;
    name: string;
    external_id: string;
}

export interface DivisionItem {
    id: string;
    name: string;
    external_id: string;
}

export interface LeagueWithDivisions {
    id: string;
    name: string;
    platform: string;
    season: string;
    divisions: DivisionItem[];
}

export interface LeaguesResponse {
    data: LeagueWithDivisions[];
}
