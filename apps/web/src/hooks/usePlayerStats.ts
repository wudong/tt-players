import { useQuery } from '@tanstack/react-query';
import { fetchPlayerStats } from '../lib/api';
import type { PlayerStats } from '../types';

export function usePlayerStats(playerId: string) {
    return useQuery<PlayerStats>({
        queryKey: ['player-stats', playerId],
        queryFn: () => fetchPlayerStats(playerId),
        enabled: Boolean(playerId),
    });
}
