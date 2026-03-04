import { useQuery } from '@tanstack/react-query';
import { fetchPlayerSearch } from '../lib/api';

export function usePlayerSearch(query: string) {
    return useQuery({
        queryKey: ['players', 'search', query],
        queryFn: () => fetchPlayerSearch(query),
    });
}
