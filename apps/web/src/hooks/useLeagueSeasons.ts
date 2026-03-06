import { useQuery } from '@tanstack/react-query';
import { fetchLeagueSeasons } from '../lib/api';

export function useLeagueSeasons() {
    return useQuery({
        queryKey: ['league-seasons'],
        queryFn: () => fetchLeagueSeasons(),
    });
}
