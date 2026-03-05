import { Trophy, Activity, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LeagueTable } from './LeagueTable';
import { LeagueWithDivisions, LeaderboardMode } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { useLeaders } from '../hooks/useLeaders';
import { useNavigate } from 'react-router-dom';
import { LeagueFilterButton } from '../components/LeagueFilterButton';

export function LeaguesHubView() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'tables' | 'cups' | 'leaders'>('tables');
    const {
        selectedLeagues: leagues,
        selectedLeagueIds,
        isLoading,
    } = useLeaguePreferences();
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
        <div className="flex min-h-screen flex-col gap-6 bg-transparent pb-28">
            <header className="tt-hero tt-hero-leagues">
                <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="tt-hero-title flex items-center gap-2 !text-[2.05rem]">
                            <Trophy size={24} className="text-blue-100" />
                            League Central
                        </h1>
                        <LeagueFilterButton
                            count={selectedLeagueIds.length}
                            onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-black/15 p-1.5 ring-1 ring-white/20 backdrop-blur-sm">
                        <button onClick={() => setSelectedTab('tables')} className={selectedTab === 'tables' ? 'tt-tab-active flex-1' : 'tt-tab flex-1'}>
                            <FileText size={15} /> Tables
                        </button>
                        <button onClick={() => setSelectedTab('cups')} className={selectedTab === 'cups' ? 'tt-tab-active flex-1' : 'tt-tab flex-1'}>
                            <Trophy size={15} /> Cups
                        </button>
                        <button onClick={() => setSelectedTab('leaders')} className={selectedTab === 'leaders' ? 'tt-tab-active flex-1' : 'tt-tab flex-1'}>
                            <Activity size={15} /> Leaders
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-5">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                    </div>
                ) : leagues.length === 0 ? (
                    <div className="tt-card flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <Trophy size={30} strokeWidth={1.6} className="text-slate-300" />
                        <h3 className="tt-title-md !text-base text-slate-700">No leagues selected</h3>
                        <p className="tt-body-sm text-slate-500">Select leagues to show them in League Central.</p>
                        <button
                            onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}
                            className="tt-chip-active"
                        >
                            Choose leagues
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {selectedTab === 'tables' && (
                            <>
                                <section className="tt-card p-4">
                                    <label className="tt-kicker mb-2 block text-slate-500">
                                        League
                                    </label>
                                    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                        {leagues.map((league) => {
                                            const isActive = selectedLeague?.id === league.id;
                                            return (
                                                <button
                                                    key={league.id}
                                                    onClick={() => {
                                                        setSelectedLeague(league);
                                                        setSelectedDivisionId(league.divisions[0]?.id ?? null);
                                                    }}
                                                    className={isActive ? 'tt-chip-active whitespace-nowrap' : 'tt-chip whitespace-nowrap'}
                                                >
                                                    {league.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <label className="tt-kicker mb-2 block text-slate-500">
                                        Division
                                    </label>
                                    {!selectedLeague || selectedLeague.divisions.length === 0 ? (
                                        <p className="tt-body-sm text-slate-500">Pick a league first.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLeague.divisions.map((division) => {
                                                const isActive = selectedDivisionId === division.id;
                                                return (
                                                    <button
                                                        key={division.id}
                                                        onClick={() => setSelectedDivisionId(division.id)}
                                                        className={isActive ? 'tt-chip-active' : 'tt-chip'}
                                                    >
                                                        {division.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="tt-card overflow-hidden">
                                    {selectedDivisionId ? (
                                        <LeagueTable competitionId={selectedDivisionId} />
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">No division selected</div>
                                    )}
                                </section>
                            </>
                        )}

                        {selectedTab === 'cups' && (
                            <div className="tt-card flex flex-col items-center gap-3 p-10 text-center text-slate-400">
                                <Trophy size={30} />
                                <p className="tt-body-sm font-semibold">Cups coming soon</p>
                            </div>
                        )}

                        {selectedTab === 'leaders' && (
                            <section className="tt-card p-4">
                                <div className="mb-3 grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setLeadersMode('win_pct')}
                                        className={leadersMode === 'win_pct' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Best Win %
                                    </button>
                                    <button
                                        onClick={() => setLeadersMode('most_played')}
                                        className={leadersMode === 'most_played' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Most Played
                                    </button>
                                    <button
                                        onClick={() => setLeadersMode('combined')}
                                        className={leadersMode === 'combined' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Combined
                                    </button>
                                </div>

                                {leadersLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                                    </div>
                                ) : !leadersData || leadersData.data.length === 0 ? (
                                    <div className="rounded-xl bg-[#f5f8ff] p-6 text-center text-sm font-medium text-slate-500">
                                        No leaderboard data available for selected leagues.
                                    </div>
                                ) : (
                                    <>
                                        <p className="tt-meta mb-3">{leadersData.formula}</p>
                                        <div className="space-y-2">
                                            {leadersData.data.map((row) => (
                                                <div
                                                    key={row.player_id}
                                                    className="flex items-center justify-between rounded-xl bg-[#f5f8ff] px-3 py-2 ring-1 ring-[#e7ecfa]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-[#2869fe] ring-1 ring-[#d7e1fa]">
                                                            {row.rank}
                                                        </span>
                                                        <div>
                                                            <p className="tt-title-md !text-sm">{row.player_name}</p>
                                                            <p className="tt-caption">
                                                                {row.wins}W-{row.losses}L • {row.played} played
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm tt-num text-[#2869fe]">{Math.round(row.win_rate)}% WR</p>
                                                        {row.score !== null && (
                                                            <p className="tt-caption">
                                                                Score {row.score.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
