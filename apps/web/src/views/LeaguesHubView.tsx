import { Trophy, Activity, FileText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Tab, TabList, Tabs } from 'react-aria-components';
import { LeagueTable } from './LeagueTable';
import { LeagueWithDivisions, LeaderboardMode } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { useLeaders } from '../hooks/useLeaders';
import { useLeagues } from '../hooks/useLeagues';
import { useLeagueSeasons } from '../hooks/useLeagueSeasons';
import { useNavigate } from 'react-router-dom';
import { LeagueFilterButton } from '../components/LeagueFilterButton';
import { PressButton } from '../ui/PressButton';

export function LeaguesHubView() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'tables' | 'leaders'>('tables');
    const {
        selectedLeagueIds,
        isLoading: preferencesLoading,
    } = useLeaguePreferences();
    const { data: seasonOptionsData, isLoading: seasonOptionsLoading } = useLeagueSeasons();
    const seasonOptions = seasonOptionsData?.data ?? [];
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
    const {
        data: leaguesData,
        isLoading: leaguesLoading,
    } = useLeagues(selectedSeasonId ?? undefined);

    useEffect(() => {
        if (seasonOptions.length === 0) return;
        if (selectedSeasonId && seasonOptions.some((season) => season.id === selectedSeasonId)) return;

        const activeSeason = seasonOptions.find((season) => season.is_active);
        setSelectedSeasonId(activeSeason?.id ?? seasonOptions[0]!.id);
    }, [seasonOptions, selectedSeasonId]);

    const allSeasonLeagues = leaguesData?.data ?? [];
    const leagues = useMemo(
        () => allSeasonLeagues.filter((league) => selectedLeagueIds.includes(league.id)),
        [allSeasonLeagues, selectedLeagueIds],
    );
    const visibleLeagueIds = useMemo(
        () => leagues.map((league) => league.id),
        [leagues],
    );
    const isLoading = preferencesLoading || seasonOptionsLoading || leaguesLoading;

    const [selectedLeague, setSelectedLeague] = useState<LeagueWithDivisions | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [leadersMode, setLeadersMode] = useState<LeaderboardMode>('combined');
    const leadersLimit = leadersMode === 'win_pct' ? 10 : 20;
    const { data: leadersData, isLoading: leadersLoading } = useLeaders(
        leadersMode,
        visibleLeagueIds,
        leadersLimit,
        3,
        selectedSeasonId ?? undefined,
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
                    <div className="mb-4 flex items-center gap-2">
                        <label className="tt-kicker text-blue-100">Season</label>
                        <div className="ml-auto rounded-xl border border-white/35 bg-white/15 px-2 py-1 backdrop-blur-sm">
                            <select
                                value={selectedSeasonId ?? ''}
                                onChange={(event) => setSelectedSeasonId(event.currentTarget.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none"
                            >
                                {seasonOptions.map((season) => (
                                    <option key={season.id} value={season.id} className="text-slate-900">
                                        {season.name}{season.is_active ? ' (Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as typeof selectedTab)}
                    >
                        <TabList
                            aria-label="League views"
                            className="flex items-center gap-2 rounded-2xl bg-black/15 p-1.5 ring-1 ring-white/20 backdrop-blur-sm"
                        >
                            <Tab
                                id="tables"
                                className={({ isSelected }) => (isSelected ? 'tt-tab-active flex-1 min-w-0' : 'tt-tab flex-1 min-w-0')}
                            >
                                <FileText size={15} /> Tables
                            </Tab>
                            <Tab
                                id="leaders"
                                className={({ isSelected }) => (isSelected ? 'tt-tab-active flex-1 min-w-0' : 'tt-tab flex-1 min-w-0')}
                            >
                                <Activity size={15} /> Leaders
                            </Tab>
                        </TabList>
                    </Tabs>
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
                        <PressButton
                            onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}
                            className="tt-chip-active"
                        >
                            Choose leagues
                        </PressButton>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {selectedTab === 'tables' && (
                            <>
                                <section className="tt-card p-4">
                                    <label className="tt-kicker mb-2 block text-slate-500">
                                        League
                                    </label>
                                    <div
                                        className="mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-1 hide-scrollbar"
                                        style={{ WebkitOverflowScrolling: 'touch' }}
                                    >
                                        {leagues.map((league) => {
                                            const isActive = selectedLeague?.id === league.id;
                                            return (
                                                <PressButton
                                                    key={league.id}
                                                    onClick={() => {
                                                        setSelectedLeague(league);
                                                        setSelectedDivisionId(league.divisions[0]?.id ?? null);
                                                    }}
                                                    className={isActive ? 'tt-chip-active shrink-0 snap-start whitespace-nowrap' : 'tt-chip shrink-0 snap-start whitespace-nowrap'}
                                                >
                                                    {league.name}
                                                </PressButton>
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
                                                    <PressButton
                                                        key={division.id}
                                                        onClick={() => setSelectedDivisionId(division.id)}
                                                        className={isActive ? 'tt-chip-active' : 'tt-chip'}
                                                    >
                                                        {division.name}
                                                    </PressButton>
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

                        {selectedTab === 'leaders' && (
                            <section className="tt-card p-4">
                                <div className="mb-3 grid grid-cols-3 gap-2">
                                    <PressButton
                                        onClick={() => setLeadersMode('win_pct')}
                                        className={leadersMode === 'win_pct' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Best Win %
                                    </PressButton>
                                    <PressButton
                                        onClick={() => setLeadersMode('most_played')}
                                        className={leadersMode === 'most_played' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Most Played
                                    </PressButton>
                                    <PressButton
                                        onClick={() => setLeadersMode('combined')}
                                        className={leadersMode === 'combined' ? 'tt-chip-active justify-center' : 'tt-chip justify-center'}
                                    >
                                        Combined
                                    </PressButton>
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
                                                <PressButton
                                                    key={row.player_id}
                                                    onClick={() => navigate(`/players/${row.player_id}`)}
                                                    className="flex w-full items-center justify-between rounded-xl bg-[#f5f8ff] px-3 py-2 text-left ring-1 ring-[#e7ecfa] transition hover:-translate-y-0.5"
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
                                                </PressButton>
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
