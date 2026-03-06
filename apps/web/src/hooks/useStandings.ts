import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../lib/api';
import type { StandingItem } from '../types';

export function useStandings(competitionId: string) {
    return useQuery<StandingItem[]>({
        queryKey: ['standings', competitionId],
        queryFn: async () => {
            const res = await fetchStandings(competitionId);
            return res.data;
        },
        enabled: Boolean(competitionId),
    });
}
