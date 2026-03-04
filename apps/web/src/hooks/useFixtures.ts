import { useQuery } from '@tanstack/react-query';
import { fetchFixtures, type FetchFixturesOptions } from '../lib/api';
import type { FixturesResponse } from '../types';

export function useFixtures(teamId: string, opts: FetchFixturesOptions = {}) {
    const { limit = 20, offset = 0 } = opts;
    return useQuery<FixturesResponse>({
        queryKey: ['fixtures', teamId, limit, offset],
        queryFn: async () => fetchFixtures(teamId, { limit, offset }),
        enabled: Boolean(teamId),
    });
}
