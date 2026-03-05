import { Trophy, ChevronDown, Activity, FileText, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LeagueTable } from './LeagueTable';
import { LeagueWithDivisions, LeaderboardMode } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { LeagueSelectionSheet } from '../components/LeagueSelectionSheet';
import { useLeaders } from '../hooks/useLeaders';

export function LeaguesHubView() {
    const [selectedTab, setSelectedTab] = useState<'tables' | 'cups' | 'leaders'>('tables');
    const {
        selectedLeagues: leagues,
        selectedLeagueIds,
        isLoading,
    } = useLeaguePreferences();
    const [isLeagueSelectionOpen, setIsLeagueSelectionOpen] = useState(false);

    const [selectedLeague, setSelectedLeague] = useState<LeagueWithDivisions | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [leadersMode, setLeadersMode] = useState<LeaderboardMode>('combined');
    const leadersLimit = leadersMode === 'win_pct' ? 10 : 20;
    const { data: leadersData, isLoading: leadersLoading } = useLeaders(
        leadersMode,
        selectedLeagueIds,
        leadersLimit,
        3,
    );

    // Initialise selection
    useEffect(() => {
        if (leagues.length === 0) {
            setSelectedLeague(null);
            setSelectedDivisionId(null);
            return;
        }

        const fallbackLeague = leagues[0];
        const nextLeague = selectedLeague && leagues.some((league) => league.id === selectedLeague.id)
            ? leagues.find((league) => league.id === selectedLeague.id) ?? fallbackLeague
            : fallbackLeague;

        if (!selectedLeague || selectedLeague.id !== nextLeague.id) {
            setSelectedLeague(nextLeague);
        }

        if (!selectedDivisionId || !nextLeague.divisions.some((division) => division.id === selectedDivisionId)) {
            setSelectedDivisionId(nextLeague.divisions[0]?.id ?? null);
        }
    }, [leagues, selectedLeague, selectedDivisionId]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300 pb-28 min-h-screen bg-slate-50">
            {/* Search Header */}
            <div className="rounded-b-[2rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 px-6 pb-6 pt-16 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <h1 className="text-3xl font-extrabold text-white mb-6 relative z-10 flex items-center gap-3 drop-shadow-md">
                    <Trophy className="text-amber-400 drop-shadow-sm" size={28} /> League Central
                </h1>

                <button
                    onClick={() => setIsLeagueSelectionOpen(true)}
                    className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/20"
                >
                    <SlidersHorizontal size={14} />
                    Edit leagues ({selectedLeagueIds.length})
                </button>

                {/* Segmented Control */}
                <div className="relative z-10 flex h-12 w-full items-center justify-between rounded-2xl bg-black/20 p-1 backdrop-blur-md ring-1 ring-white/10">
                    <button
                        onClick={() => setSelectedTab('tables')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all duration-300 ${selectedTab === 'tables' ? 'bg-white text-emerald-700 shadow-md scale-[1.02]' : 'text-emerald-50 hover:text-white'
                            }`}
                    >
                        <FileText size={16} /> Tables
                    </button>
                    <button
                        onClick={() => setSelectedTab('cups')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all duration-300 ${selectedTab === 'cups' ? 'bg-white text-emerald-700 shadow-md scale-[1.02]' : 'text-emerald-50 hover:text-white'
                            }`}
                    >
                        <Trophy size={16} /> Cups
                    </button>
                    <button
                        onClick={() => setSelectedTab('leaders')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all duration-300 ${selectedTab === 'leaders' ? 'bg-white text-emerald-700 shadow-md scale-[1.02]' : 'text-emerald-50 hover:text-white'
                            }`}
                    >
                        <Activity size={16} /> Leaders
                    </button>
                </div>
            </div>

            <div className="px-5 flex flex-col gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : leagues.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                        <Trophy size={30} strokeWidth={1.5} className="text-slate-300" />
                        <h3 className="text-base font-bold text-slate-700">No leagues selected</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Select leagues to show them in League Central.
                        </p>
                        <button
                            onClick={() => setIsLeagueSelectionOpen(true)}
                            className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                        >
                            Choose leagues
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Identical UI structure matching the mock */}
                        {selectedTab === 'tables' && (
                            <>
                                {/* League & Division selector */}
                                <section className="flex flex-col gap-3">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                League
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full appearance-none rounded-2xl bg-white px-4 py-4 pr-10 text-base font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={selectedLeague?.id || ''}
                                                    onChange={(e) => {
                                                        const league = leagues.find(l => l.id === e.target.value);
                                                        if (league) {
                                                            setSelectedLeague(league);
                                                            setSelectedDivisionId(league.divisions[0]?.id || null);
                                                        }
                                                    }}
                                                >
                                                    {leagues.map(l => (
                                                        <option key={l.id} value={l.id}>{l.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                Division
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full appearance-none rounded-2xl bg-white px-4 py-4 pr-10 text-base font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                                    value={selectedDivisionId || ''}
                                                    onChange={(e) => setSelectedDivisionId(e.target.value)}
                                                    disabled={!selectedLeague || selectedLeague.divisions.length === 0}
                                                >
                                                    {selectedLeague?.divisions.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500">
                                            Pick a league first, then choose its division.
                                        </p>
                                    </div>
                                </section>

                                {/* Division Standings Card */}
                                <section className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                    {selectedDivisionId ? (
                                        <LeagueTable competitionId={selectedDivisionId} />
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">No division selected</div>
                                    )}
                                </section>
                            </>
                        )}

                        {selectedTab === 'cups' && (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100">
                                <Trophy size={32} />
                                <span className="font-semibold text-sm">Cups coming soon</span>
                            </div>
                        )}

                        {selectedTab === 'leaders' && (
                            <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <div className="mb-3 grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setLeadersMode('win_pct')}
                                        className={`rounded-xl px-2 py-2 text-xs font-semibold ${leadersMode === 'win_pct' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Best Win %
                                    </button>
                                    <button
                                        onClick={() => setLeadersMode('most_played')}
                                        className={`rounded-xl px-2 py-2 text-xs font-semibold ${leadersMode === 'most_played' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Most Played
                                    </button>
                                    <button
                                        onClick={() => setLeadersMode('combined')}
                                        className={`rounded-xl px-2 py-2 text-xs font-semibold ${leadersMode === 'combined' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Combined
                                    </button>
                                </div>

                                {leadersLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                                    </div>
                                ) : !leadersData || leadersData.data.length === 0 ? (
                                    <div className="p-8 text-center text-sm font-medium text-slate-500">
                                        No leaderboard data available for selected leagues.
                                    </div>
                                ) : (
                                    <>
                                        <p className="mb-3 text-xs text-slate-500">{leadersData.formula}</p>
                                        <div className="space-y-2">
                                            {leadersData.data.map((row) => (
                                                <div
                                                    key={row.player_id}
                                                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700 ring-1 ring-slate-200">
                                                            {row.rank}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{row.player_name}</p>
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                {row.wins}W-{row.losses}L · {row.played} played
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-emerald-700">{Math.round(row.win_rate)}% WR</p>
                                                        {row.score !== null && (
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                Score {row.score.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            <LeagueSelectionSheet
                isOpen={isLeagueSelectionOpen}
                onClose={() => setIsLeagueSelectionOpen(false)}
                title="Choose Leagues for League Central"
            />
        </div>
    );
}
