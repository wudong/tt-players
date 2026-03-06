import { useQuery } from '@tanstack/react-query';
import { fetchPlayerInsights } from '../lib/api';

export function usePlayerInsights(playerId: string) {
    return useQuery({
        queryKey: ['player-insights', playerId],
        queryFn: () => fetchPlayerInsights(playerId),
        enabled: Boolean(playerId),
    });
}
