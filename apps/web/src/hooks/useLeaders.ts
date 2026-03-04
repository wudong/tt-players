import { useQuery } from '@tanstack/react-query';
import { fetchLeaders } from '../lib/api';
import type { LeaderboardMode } from '../types';

export function useLeaders(mode: LeaderboardMode, leagueIds: string[], limit = 20, minPlayed = 3) {
    const sortedLeagueIds = [...leagueIds].sort();
    const enabled = sortedLeagueIds.length > 0;

    return useQuery({
        queryKey: ['leaders', mode, sortedLeagueIds.join(','), limit, minPlayed],
        queryFn: () => fetchLeaders(mode, sortedLeagueIds, limit, minPlayed),
        enabled,
    });
}
