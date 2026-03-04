import { Trophy, ChevronDown, Activity, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LeagueTable } from './LeagueTable';
import { useLeagues } from '../hooks/useLeagues';
import { LeagueWithDivisions } from '../types';

export function LeaguesHubView() {
    const [selectedTab, setSelectedTab] = useState<'tables' | 'cups' | 'leaders'>('tables');
    const { data: leaguesData, isLoading } = useLeagues();
    const leagues = leaguesData?.data || [];

    const [selectedLeague, setSelectedLeague] = useState<LeagueWithDivisions | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);

    // Initialise selection
    useEffect(() => {
        if (leagues.length > 0 && !selectedLeague) {
            setSelectedLeague(leagues[0]);
            if (leagues[0].divisions.length > 0) {
                setSelectedDivisionId(leagues[0].divisions[0].id);
            }
        }
    }, [leagues, selectedLeague]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300 pb-28 min-h-screen bg-slate-50">
            {/* Search Header */}
            <div className="rounded-b-[2rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 px-6 pb-6 pt-16 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <h1 className="text-3xl font-extrabold text-white mb-6 relative z-10 flex items-center gap-3 drop-shadow-md">
                    <Trophy className="text-amber-400 drop-shadow-sm" size={28} /> League Central
                </h1>

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
                        <h3 className="text-base font-bold text-slate-700">No leagues yet</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Run the worker to scrape league data.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Identical UI structure matching the mock */}
                        {selectedTab === 'tables' && (
                            <>
                                {/* League & Division selector */}
                                <section className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none rounded-2xl bg-white px-4 py-3.5 pr-10 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none rounded-2xl bg-white px-4 py-3.5 pr-10 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100">
                                <Activity size={32} />
                                <span className="font-semibold text-sm">Player Leaderboards coming soon</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
