import { useQuery } from '@tanstack/react-query';
import { fetchFixtures, type FetchFixturesOptions } from '../lib/api';
import type { FixtureItem } from '../types';

export function useFixtures(teamId: string, opts: FetchFixturesOptions = {}) {
    const { limit = 20, offset = 0 } = opts;
    return useQuery<FixtureItem[]>({
        queryKey: ['fixtures', teamId, limit, offset],
        queryFn: async () => {
            const res = await fetchFixtures(teamId, { limit, offset });
            return res.data;
        },
        enabled: Boolean(teamId),
    });
}
