import { useQuery } from '@tanstack/react-query';
import { fetchPlayerCurrentSeasonAffiliations } from '../lib/api';

export function usePlayerCurrentSeasonAffiliations(playerId: string | undefined) {
    return useQuery({
        queryKey: ['players', playerId, 'affiliations', 'current-season'],
        queryFn: () => fetchPlayerCurrentSeasonAffiliations(playerId!),
        enabled: Boolean(playerId),
    });
}
