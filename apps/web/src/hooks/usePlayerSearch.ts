import { useQuery } from '@tanstack/react-query';
import { fetchPlayerSearch } from '../lib/api';

interface UsePlayerSearchOptions {
    enabled?: boolean;
}

export function usePlayerSearch(
    query: string,
    leagueIds: string[] = [],
    { enabled = true }: UsePlayerSearchOptions = {},
) {
    const normalized = query.trim();
    const shouldFetch = normalized.length === 0 || normalized.length > 2;
    const sortedLeagueIds = [...leagueIds].sort();

    return useQuery({
        queryKey: ['players', 'search', normalized, sortedLeagueIds.join(',')],
        queryFn: () => fetchPlayerSearch(normalized, sortedLeagueIds),
        enabled: shouldFetch && enabled,
    });
}
