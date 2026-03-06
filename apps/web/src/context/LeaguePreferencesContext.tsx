import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useLeagues } from '../hooks/useLeagues';
import type { LeagueWithDivisions } from '../types';

const STORAGE_KEY = 'tt_players_selected_league_ids';

interface LeaguePreferencesContextValue {
    allLeagues: LeagueWithDivisions[];
    selectedLeagueIds: string[];
    selectedLeagues: LeagueWithDivisions[];
    isLoading: boolean;
    toggleLeague: (leagueId: string) => void;
    selectAllLeagues: () => void;
    clearSelectedLeagues: () => void;
}

const LeaguePreferencesContext = createContext<LeaguePreferencesContextValue | null>(null);

function parseStoredLeagueIds(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is string => typeof item === 'string');
    } catch {
        return [];
    }
}

export function LeaguePreferencesProvider({ children }: { children: ReactNode }) {
    const { data: leaguesData, isLoading } = useLeagues();
    const allLeagues = leaguesData?.data ?? [];

    const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (allLeagues.length === 0 || isInitialized) return;

        const validLeagueIds = new Set(allLeagues.map((league) => league.id));
        const stored = parseStoredLeagueIds().filter((id) => validLeagueIds.has(id));
        const initialSelection = stored.length > 0 ? stored : Array.from(validLeagueIds);

        setSelectedLeagueIds(initialSelection);
        setIsInitialized(true);
    }, [allLeagues, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedLeagueIds));
    }, [isInitialized, selectedLeagueIds]);

    const toggleLeague = useCallback((leagueId: string) => {
        setSelectedLeagueIds((prev) =>
            prev.includes(leagueId)
                ? prev.filter((id) => id !== leagueId)
                : [...prev, leagueId],
        );
    }, []);

    const selectAllLeagues = useCallback(() => {
        setSelectedLeagueIds(allLeagues.map((league) => league.id));
    }, [allLeagues]);

    const clearSelectedLeagues = useCallback(() => {
        setSelectedLeagueIds([]);
    }, []);

    const selectedLeagues = useMemo(
        () => allLeagues.filter((league) => selectedLeagueIds.includes(league.id)),
        [allLeagues, selectedLeagueIds],
    );

    const value = useMemo<LeaguePreferencesContextValue>(() => ({
        allLeagues,
        selectedLeagueIds,
        selectedLeagues,
        isLoading: isLoading || !isInitialized,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
    }), [
        allLeagues,
        selectedLeagueIds,
        selectedLeagues,
        isLoading,
        isInitialized,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
    ]);

    return (
        <LeaguePreferencesContext.Provider value={value}>
            {children}
        </LeaguePreferencesContext.Provider>
    );
}

export function useLeaguePreferences() {
    const context = useContext(LeaguePreferencesContext);
    if (!context) {
        throw new Error('useLeaguePreferences must be used within LeaguePreferencesProvider');
    }
    return context;
}
