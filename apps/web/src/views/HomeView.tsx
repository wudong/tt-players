import { Search, Filter, TrendingUp, ChevronRight, Medal, Flame } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { PlayerSearchItem } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { LeagueSelectionSheet } from '../components/LeagueSelectionSheet';

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function PlayerCard({ player, onClick }: { player: PlayerSearchItem & { played?: number; wins?: number }; onClick: () => void }) {
    const played = player.played ?? 0;
    const wins = player.wins ?? 0;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return (
        <button
            onClick={onClick}
            className="flex w-full items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:scale-[1.02] hover:shadow-md"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-inner">
                    <span className="text-lg font-bold text-white tracking-widest">{getInitials(player.name)}</span>
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-slate-800">{player.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                        <span className={`rounded-md px-2 py-0.5 ${winRate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {winRate}% WR
                        </span>
                        <span className="text-slate-400 font-medium">{played} matches</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {winRate >= 80 && played >= 10 && <Medal className="text-amber-400 drop-shadow-sm" size={20} />}
                {wins >= 5 && <Flame className="text-orange-500 max-sm:hidden" size={18} />}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <ChevronRight size={18} />
                </div>
            </div>
        </button>
    );
}

export function HomeView() {
    const [query, setQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 pb-28">
            <header className="relative w-full rounded-b-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 px-6 pb-8 pt-16 shadow-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">TT Hub</h1>
                        <p className="mt-1 text-sm font-medium text-emerald-100/90 tracking-wide">Table tennis stats & analysis</p>
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 hover:scale-105 active:scale-95 shadow-sm"
                        aria-label="Select leagues"
                    >
                        <Filter size={20} />
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur transition-all group-focus-within:bg-emerald-400/30"></div>
                    <div className="relative flex items-center rounded-2xl bg-white/95 p-1.5 shadow-xl backdrop-blur-xl ring-1 ring-white/50 transition-all focus-within:ring-p-500">
                        <div className="flex h-10 w-10 items-center justify-center text-emerald-600/70">
                            <Search size={20} strokeWidth={2.5} />
                        </div>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find players, clubs, or leagues..."
                            className="w-full bg-transparent px-2 py-2 text-[15px] font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 px-5 pt-8 z-10 -mt-2">
                <div className="mb-4 flex items-end justify-between px-1">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                        {isSearchMode ? <><Search size={20} className="text-emerald-500" /> Search Results</> : <><TrendingUp size={20} className="text-emerald-500" /> Trending Players</>}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                        {selectedLeagueIds.length} league{selectedLeagueIds.length === 1 ? '' : 's'} selected
                    </p>
                </div>

                {leaguePreferencesLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : !hasSelectedLeagues ? (
                    <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-600 ring-1 ring-slate-100">
                        Select at least one league to view trending players.
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {searchResults?.data?.map((player) => (
                            <PlayerCard
                                key={player.id}
                                player={player}
                                onClick={() => navigate(`/players/${player.id}`)}
                            />
                        ))}
                        {searchResults?.data?.length === 0 && (
                            <div className="text-center p-8 text-slate-500">
                                {isSearchMode
                                    ? `No players found matching "${normalizedQuery}"`
                                    : 'No trending players available yet.'}
                            </div>
                        )}
                    </div>
                )}
            </main>
            <LeagueSelectionSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
        </div>
    );
}
