import { useQuery } from '@tanstack/react-query';
import { fetchPlayerH2H } from '../lib/api';

export function usePlayerH2H(playerId1: string | undefined, playerId2: string | undefined) {
    return useQuery({
        queryKey: ['players', 'h2h', playerId1, playerId2],
        queryFn: () => fetchPlayerH2H(playerId1!, playerId2!),
        enabled: !!playerId1 && !!playerId2,
    });
}
