import { useQuery } from '@tanstack/react-query';
import { fetchFixtureRubbers } from '../lib/api';

export function useFixtureRubbers(fixtureId: string | undefined) {
    return useQuery({
        queryKey: ['fixtures', fixtureId, 'rubbers'],
        queryFn: () => fetchFixtureRubbers(fixtureId!),
        enabled: !!fixtureId,
    });
}
