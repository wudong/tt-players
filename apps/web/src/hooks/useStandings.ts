import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../lib/api';
import type { StandingsResponse } from '../types';

export function useStandings(competitionId: string) {
    return useQuery<StandingsResponse>({
        queryKey: ['standings', competitionId],
        queryFn: () => fetchStandings(competitionId),
        enabled: Boolean(competitionId),
    });
}
