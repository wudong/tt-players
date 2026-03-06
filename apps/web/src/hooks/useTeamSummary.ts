import { useQuery } from '@tanstack/react-query';
import { fetchTeamSummary } from '../lib/api';

export function useTeamSummary(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teams', teamId, 'summary'],
        queryFn: () => fetchTeamSummary(teamId!),
        enabled: !!teamId,
    });
}
