import { useQuery } from '@tanstack/react-query';
import { fetchTeamForm } from '../lib/api';

export function useTeamForm(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teams', teamId, 'form'],
        queryFn: () => fetchTeamForm(teamId!),
        enabled: !!teamId,
    });
}
