import { useQuery } from '@tanstack/react-query';
import { fetchTeamRoster } from '../lib/api';

export function useTeamRoster(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teams', teamId, 'roster'],
        queryFn: () => fetchTeamRoster(teamId!),
        enabled: !!teamId,
    });
}
