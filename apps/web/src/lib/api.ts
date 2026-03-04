import type { StandingsResponse, FixturesResponse, PlayerStats } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4003';

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

export function fetchPlayerSearch(query: string) {
    return apiFetch<import('../types').PlayerSearchResponse>(`/players/search?q=${encodeURIComponent(query)}`);
}

export function fetchPlayerExtendedStats(playerId: string) {
    return apiFetch<import('../types').ExtendedPlayerStats>(`/players/${playerId}/stats/extended`);
}

export function fetchPlayerRubbers(playerId: string) {
    return apiFetch<import('../types').RubbersResponse>(`/players/${playerId}/rubbers`);
}

export function fetchPlayerH2H(playerId: string, opponentId: string) {
    return apiFetch<import('../types').H2HResponse>(`/players/${playerId}/h2h/${opponentId}`);
}

export function fetchTeamRoster(teamId: string) {
    return apiFetch<import('../types').RosterResponse>(`/teams/${teamId}/roster`);
}

export function fetchTeamForm(teamId: string) {
    return apiFetch<import('../types').TeamFormResponse>(`/teams/${teamId}/form`);
}

export function fetchFixtureRubbers(fixtureId: string) {
    return apiFetch<import('../types').FixtureRubbersResponse>(`/fixtures/${fixtureId}/rubbers`);
}

export function fetchLeagues() {
    return apiFetch<import('../types').LeaguesResponse>('/leagues');
}
