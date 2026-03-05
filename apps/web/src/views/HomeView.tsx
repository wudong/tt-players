import { Search, TrendingUp, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { PlayerSearchItem } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { LeagueFilterButton } from '../components/LeagueFilterButton';

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function PlayerCard({
    player,
    onClick,
}: {
    player: PlayerSearchItem & { played?: number; wins?: number };
    onClick: () => void;
}) {
    const played = player.played ?? 0;
    const wins = player.wins ?? 0;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return (
        <button
            onClick={onClick}
            className="tt-card flex w-full items-center justify-between p-4 text-left transition hover:-translate-y-0.5"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2869fe] to-[#7c66ff] text-sm font-extrabold tracking-wide text-white">
                    {getInitials(player.name)}
                </div>
                <div>
                    <h3 className="tt-title-md">{player.name}</h3>
                    <p className="tt-meta mt-0.5">
                        {winRate}% WR • {played} matches
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="tt-chip-active">Open</span>
                <ChevronRight size={16} className="text-slate-400" />
            </div>
        </button>
    );
}

export function HomeView() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const {
        selectedLeagueIds,
        isLoading: leaguePreferencesLoading,
    } = useLeaguePreferences();
    const hasSelectedLeagues = selectedLeagueIds.length > 0;
    const { data: searchResults, isLoading } = usePlayerSearch(query, selectedLeagueIds, {
        enabled: hasSelectedLeagues,
    });
    const normalizedQuery = query.trim();
    const isSearchMode = normalizedQuery.length > 2;

    return (
        <div className="flex min-h-screen flex-col bg-transparent pb-28">
            <header className="tt-hero tt-hero-home">
                <div className="relative z-10">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <p className="tt-kicker text-blue-100">Welcome Back</p>
                            <h1 className="tt-hero-title mt-1">TT Hub</h1>
                            <p className="tt-hero-subtitle mt-2">Find players, trends and league performance</p>
                        </div>
                        <LeagueFilterButton
                            count={selectedLeagueIds.length}
                            onClick={() => navigate('/leagues/select', { state: { returnTo: '/' } })}
                        />
                    </div>
                    <div className="tt-search-shell">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search players..."
                            className="tt-input"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 px-5 pt-6">
                <div className="tt-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="tt-title-lg flex items-center gap-2">
                            {isSearchMode ? <Search size={18} className="text-[#2869fe]" /> : <TrendingUp size={18} className="text-[#2869fe]" />}
                            {isSearchMode ? 'Search Results' : 'Trending Players'}
                        </h2>
                        <p className="tt-meta font-bold">
                            {selectedLeagueIds.length} league{selectedLeagueIds.length === 1 ? '' : 's'} selected
                        </p>
                    </div>

                    {leaguePreferencesLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                        </div>
                    ) : !hasSelectedLeagues ? (
                        <div className="rounded-xl bg-[#f5f8ff] p-4 tt-body-sm">
                            Select at least one league to view trending players.
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {searchResults?.data?.map((player) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    onClick={() => navigate(`/players/${player.id}`)}
                                />
                            ))}
                            {searchResults?.data?.length === 0 && (
                                <div className="rounded-xl bg-[#f5f8ff] p-5 text-center tt-body-sm text-slate-500">
                                    {isSearchMode
                                        ? `No players found matching "${normalizedQuery}"`
                                        : 'No trending players available yet.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
