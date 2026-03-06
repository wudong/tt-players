import { useQuery } from '@tanstack/react-query';
import { fetchLeagues } from '../lib/api';

export function useLeagues(seasonId?: string) {
    return useQuery({
        queryKey: ['leagues', seasonId ?? 'active'],
        queryFn: () => fetchLeagues(seasonId),
    });
}
