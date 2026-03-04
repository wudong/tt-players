import { useQuery } from '@tanstack/react-query';
import { fetchPlayerRubbers } from '../lib/api';

interface PlayerRubbersOptions {
    limit?: number;
    offset?: number;
}

export function usePlayerRubbers(playerId: string | undefined, { limit = 20, offset = 0 }: PlayerRubbersOptions = {}) {
    return useQuery({
        queryKey: ['players', playerId, 'rubbers', limit, offset],
        queryFn: () => fetchPlayerRubbers(playerId!, limit, offset),
        enabled: !!playerId,
    });
}
