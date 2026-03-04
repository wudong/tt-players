import { useQuery } from '@tanstack/react-query';
import { fetchPlayerRubbers } from '../lib/api';

export function usePlayerRubbers(playerId: string | undefined) {
    return useQuery({
        queryKey: ['players', playerId, 'rubbers'],
        queryFn: () => fetchPlayerRubbers(playerId!),
        enabled: !!playerId,
    });
}
