import { useQuery } from '@tanstack/react-query';
import { fetchLeagues } from '../lib/api';

export function useLeagues() {
    return useQuery({
        queryKey: ['leagues'],
        queryFn: () => fetchLeagues(),
    });
}
