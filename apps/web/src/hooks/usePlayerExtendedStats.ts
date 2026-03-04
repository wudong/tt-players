import { useQuery } from '@tanstack/react-query';
import { fetchPlayerExtendedStats } from '../lib/api';

export function usePlayerExtendedStats(playerId: string | undefined) {
    return useQuery({
        queryKey: ['players', playerId, 'stats', 'extended'],
        queryFn: () => fetchPlayerExtendedStats(playerId!),
        enabled: !!playerId,
    });
}
