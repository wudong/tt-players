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
    source_url: string | null;
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
    home_team_name: string | null;
    away_team_name: string | null;
    home_score: number | null;
    away_score: number | null;
    date_played: string;
    status: FixtureStatus;
    round_name: string | null;
    round_order: number | null;
}

export interface FixturesResponse {
    availability: 'available' | 'no_matches_yet' | 'source_data_missing';
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

export interface FavouritePlayer {
    id: string;
    name: string;
    played: number;
    wins: number;
}

export type LeaderboardMode = 'win_pct' | 'most_played' | 'combined';

export interface LeaderboardItem {
    rank: number;
    player_id: string;
    player_name: string;
    played: number;
    wins: number;
    losses: number;
    win_rate: number;
    score: number | null;
}

export interface LeadersResponse {
    mode: LeaderboardMode;
    formula: string;
    min_played: number;
    data: LeaderboardItem[];
}

export interface ExtendedPlayerStats extends PlayerStats {
    nemesis_id: string | null;
    nemesis: string;
    duo: string;
    streak: string;
    most_played_opponents: Array<{
        opponent_id: string;
        opponent_name: string;
        played: number;
        wins: number;
        losses: number;
        win_rate: number;
    }>;
}

export interface PlayerInsights {
    player_id: string;
    player_name: string;
    years_played: number;
    first_match_date: string | null;
    latest_match_date: string | null;
    career_by_year: Array<{
        year: number;
        played: number;
        wins: number;
        losses: number;
        win_rate: number;
    }>;
    peaks: {
        best_season: { year: number; played: number; win_rate: number } | null;
        most_active_season: { year: number; played: number } | null;
        best_month: { month: string; played: number; win_rate: number } | null;
        worst_month: { month: string; played: number; win_rate: number } | null;
    };
    rivals: {
        toughest: {
            opponent_id: string;
            opponent_name: string;
            played: number;
            wins: number;
            losses: number;
            win_rate: number;
        } | null;
        easiest: {
            opponent_id: string;
            opponent_name: string;
            played: number;
            wins: number;
            losses: number;
            win_rate: number;
        } | null;
        improving_vs: {
            opponent_id: string;
            opponent_name: string;
            first_half_win_rate: number;
            second_half_win_rate: number;
            delta_points: number;
        } | null;
    };
    style: {
        singles: { played: number; wins: number; losses: number; win_rate: number };
        doubles: { played: number; wins: number; losses: number; win_rate: number };
        score_patterns: Array<{ score: string; count: number }>;
    };
    form: {
        rolling_10_win_rate: number;
        rolling_20_win_rate: number;
        momentum: 'hot' | 'steady' | 'cold' | 'new';
        recent_results: Array<'W' | 'L'>;
    };
    context: {
        home: { played: number; wins: number; win_rate: number };
        away: { played: number; wins: number; win_rate: number };
        by_league: Array<{ league: string; played: number; win_rate: number }>;
        by_division: Array<{ division: string; played: number; win_rate: number }>;
    };
    milestones: {
        total_matches: number;
        longest_win_streak: number;
        milestone_hits: number[];
    };
    projection: {
        current_season_matches: number;
        current_season_win_rate: number;
        projected_matches: number;
        on_track_for_70_win_rate: boolean;
    };
}

export interface RubberItem {
    id: string;
    fixture_id: string;
    date: string;
    league: string;
    opponent: string;
    opponent_id: string | null;
    result: string;
    isWin: boolean;
}

export interface RubbersResponse {
    total: number;
    limit: number;
    offset: number;
    data: RubberItem[];
}

export interface H2HResponse {
    player1_wins: number;
    player2_wins: number;
    encounters: RubberItem[];
}

export interface PlayerCurrentSeasonAffiliation {
    team_id: string;
    team_name: string;
    league_id: string;
    league_name: string;
    season_id: string;
    season_name: string;
    competition_name: string;
}

export interface PlayerCurrentSeasonAffiliationsResponse {
    data: PlayerCurrentSeasonAffiliation[];
}

export interface RosterItem {
    id: string;
    name: string;
    played: number;
    winRate: number;
    wins: number;
}

export interface RosterResponse {
    availability: 'available' | 'no_matches_yet' | 'source_data_missing';
    data: RosterItem[];
}

export interface TeamFormResponse {
    form: string[];
    position: number | null;
    points: number | null;
}

export interface TeamSummaryResponse {
    id: string;
    name: string;
    league_id: string | null;
    league_name: string | null;
    season_id: string | null;
    season_name: string | null;
    competition_id: string | null;
    competition_name: string | null;
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

export interface FixtureMeta {
    id: string;
    played_at: string | null;
    league_name: string;
    division_name: string;
    home_team_name: string | null;
    away_team_name: string | null;
    source_url: string | null;
}

export interface FixtureRubbersResponse {
    fixture: FixtureMeta;
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
    season_id: string;
    season: string;
    divisions: DivisionItem[];
}

export interface LeaguesResponse {
    data: LeagueWithDivisions[];
}

export interface LeagueSeason {
    id: string;
    name: string;
    is_active: boolean;
}

export interface LeagueSeasonsResponse {
    data: LeagueSeason[];
}
