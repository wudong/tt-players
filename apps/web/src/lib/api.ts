import type { StandingsResponse, FixturesResponse, PlayerStats } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export function fetchStandings(competitionId: string): Promise<StandingsResponse> {
    return apiFetch<StandingsResponse>(`/competitions/${competitionId}/standings`);
}

export interface FetchFixturesOptions {
    limit?: number;
    offset?: number;
}

export function fetchFixtures(
    teamId: string,
    { limit = 20, offset = 0 }: FetchFixturesOptions = {},
): Promise<FixturesResponse> {
    return apiFetch<FixturesResponse>(
        `/teams/${teamId}/fixtures?limit=${limit}&offset=${offset}`,
    );
}

export function fetchPlayerStats(playerId: string): Promise<PlayerStats> {
    return apiFetch<PlayerStats>(`/players/${playerId}/stats`);
}

export function fetchPlayerSearch(query: string, leagueIds: string[] = []) {
    const normalized = query.trim();
    const params = new URLSearchParams();
    if (normalized.length > 0) {
        params.set('q', normalized);
    }
    if (leagueIds.length > 0) {
        params.set('league_ids', leagueIds.join(','));
    }
    const path = params.size > 0
        ? `/players/search?${params.toString()}`
        : '/players/search';
    return apiFetch<import('../types').PlayerSearchResponse>(path);
}

export function fetchLeaders(
    mode: import('../types').LeaderboardMode,
    leagueIds: string[],
    limit = 20,
    minPlayed = 3,
    seasonId?: string,
) {
    const params = new URLSearchParams({
        mode,
        limit: String(limit),
        min_played: String(minPlayed),
    });
    if (leagueIds.length > 0) {
        params.set('league_ids', leagueIds.join(','));
    }
    if (seasonId) {
        params.set('season_id', seasonId);
    }
    return apiFetch<import('../types').LeadersResponse>(`/players/leaders?${params.toString()}`);
}

export function fetchPlayerExtendedStats(playerId: string) {
    return apiFetch<import('../types').ExtendedPlayerStats>(`/players/${playerId}/stats/extended`);
}

export function fetchPlayerRubbers(playerId: string, limit = 20, offset = 0) {
    return apiFetch<import('../types').RubbersResponse>(
        `/players/${playerId}/rubbers?limit=${limit}&offset=${offset}`,
    );
}

export function fetchPlayerH2H(playerId: string, opponentId: string) {
    return apiFetch<import('../types').H2HResponse>(`/players/${playerId}/h2h/${opponentId}`);
}

export function fetchPlayerCurrentSeasonAffiliations(playerId: string) {
    return apiFetch<import('../types').PlayerCurrentSeasonAffiliationsResponse>(
        `/players/${playerId}/affiliations/current-season`,
    );
}

export function fetchPlayerInsights(playerId: string) {
    return apiFetch<import('../types').PlayerInsights>(`/players/${playerId}/insights`);
}

export function fetchTeamRoster(teamId: string) {
    return apiFetch<import('../types').RosterResponse>(`/teams/${teamId}/roster`);
}

export function fetchTeamForm(teamId: string) {
    return apiFetch<import('../types').TeamFormResponse>(`/teams/${teamId}/form`);
}

export function fetchTeamSummary(teamId: string) {
    return apiFetch<import('../types').TeamSummaryResponse>(`/teams/${teamId}/summary`);
}

export function fetchFixtureRubbers(fixtureId: string) {
    return apiFetch<import('../types').FixtureRubbersResponse>(`/fixtures/${fixtureId}/rubbers`);
}

export function fetchLeagues(seasonId?: string) {
    if (!seasonId) {
        return apiFetch<import('../types').LeaguesResponse>('/leagues');
    }
    const params = new URLSearchParams({ season_id: seasonId });
    return apiFetch<import('../types').LeaguesResponse>(`/leagues?${params.toString()}`);
}

export function fetchLeagueSeasons() {
    return apiFetch<import('../types').LeagueSeasonsResponse>('/leagues/seasons');
}
