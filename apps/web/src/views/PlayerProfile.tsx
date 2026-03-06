import { MapPin, Swords, Shield, Zap, Calendar, Building2, Star, Flame, BarChart3, Target, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePlayerExtendedStats } from '../hooks/usePlayerExtendedStats';
import { usePlayerRubbers } from '../hooks/usePlayerRubbers';
import { usePlayerCurrentSeasonAffiliations } from '../hooks/usePlayerCurrentSeasonAffiliations';
import { usePlayerInsights } from '../hooks/usePlayerInsights';
import { winPercentage } from '../types';
import { useNavigate } from 'react-router-dom';
import { useFavouritePlayers } from '../hooks/useFavouritePlayers';

interface Props {
    playerId: string;
}

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function formatMonthLabel(month: string | null): string {
    if (!month) return '-';
    const date = new Date(`${month}-01T00:00:00Z`);
    return Number.isNaN(date.getTime())
        ? month
        : date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function PlayerProfile({ playerId }: Props) {
    const PAGE_SIZE = 20;
    const navigate = useNavigate();
    const { isFavouritePlayer, toggleFavouritePlayer } = useFavouritePlayers();
    const { data: stats, isLoading: statsLoading, isError: statsError } = usePlayerExtendedStats(playerId);
    const { data: insights, isLoading: insightsLoading } = usePlayerInsights(playerId);
    const { data: affiliationsData, isLoading: affiliationsLoading } = usePlayerCurrentSeasonAffiliations(playerId);
    const [offset, setOffset] = useState(0);
    const [rubbers, setRubbers] = useState<import('../types').RubberItem[]>([]);
    const {
        data: rubbersData,
        isLoading: rubbersLoading,
        isFetching: rubbersFetching,
    } = usePlayerRubbers(playerId, { limit: PAGE_SIZE, offset });
    const loadMoreScrollYRef = useRef<number | null>(null);

    useEffect(() => {
        setOffset(0);
        setRubbers([]);
    }, [playerId]);

    useEffect(() => {
        if (!rubbersData) return;
        setRubbers((prev) => {
            if (offset === 0) return rubbersData.data;
            const existingIds = new Set(prev.map((item) => item.id));
            const next = rubbersData.data.filter((item) => !existingIds.has(item.id));
            return [...prev, ...next];
        });

        if (offset > 0 && loadMoreScrollYRef.current !== null) {
            const scrollY = loadMoreScrollYRef.current;
            requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, behavior: 'auto' });
            });
            loadMoreScrollYRef.current = null;
        }
    }, [rubbersData, offset]);

    if (statsLoading) {
        return (
            <div role="status" aria-label="Loading player profile" className="flex flex-col gap-6 p-4 animate-pulse">
                <div className="h-48 rounded-[2rem] bg-slate-200" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-28 rounded-3xl bg-slate-200" />
                    <div className="h-28 rounded-3xl bg-slate-200" />
                </div>
                <div className="space-y-3">
                    <div className="h-6 w-32 bg-slate-200 rounded" />
                    <div className="h-20 bg-slate-200 rounded-2xl" />
                    <div className="h-20 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (statsError || !stats) {
        return (
            <div className="p-4">
                <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-700">
                    <span>⚠</span>
                    <p>Failed to load player profile.</p>
                </div>
            </div>
        );
    }

    const pct = winPercentage(stats);
    const totalRubbers = rubbersData?.total ?? 0;
    const hasMoreRubbers = rubbers.length < totalRubbers;
    const affiliations = affiliationsData?.data ?? [];
    const nemesisName = stats.nemesis ? stats.nemesis.split(' (')[0] : '';
    const mostPlayedOpponents = stats.most_played_opponents.slice(0, 6);
    const isFavourited = isFavouritePlayer(stats.player_id);
    const careerYears = insights?.years_played ?? 0;
    const bestSeason = insights?.peaks.best_season;
    const mostActiveSeason = insights?.peaks.most_active_season;
    const improvingVs = insights?.rivals.improving_vs;
    const milestoneHits = insights?.milestones.milestone_hits ?? [];
    const topLeague = insights?.context.by_league[0] ?? null;
    const momentumTone = insights?.form.momentum ?? 'new';
    const momentumLabel = momentumTone === 'hot'
        ? 'Hot'
        : momentumTone === 'steady'
            ? 'Steady'
            : momentumTone === 'cold'
                ? 'Cold'
                : 'New';

    const openH2H = (opponentId: string, opponentName: string) => {
        navigate('/h2h', {
            state: {
                playerA: {
                    id: stats.player_id,
                    name: stats.player_name,
                    played: stats.total,
                    wins: stats.wins,
                },
                playerB: {
                    id: opponentId,
                    name: opponentName,
                    played: 0,
                    wins: 0,
                },
            },
        });
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
            <header className="tt-hero tt-hero-player px-4 pb-8 pt-12 text-white">
                <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-md ring-1 ring-white/40 shadow-inner">
                            {getInitials(stats.player_name)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="tt-hero-title !text-[2rem] truncate">{stats.player_name}</h2>
                            <div className="tt-hero-subtitle mt-1 flex items-center gap-1.5 !text-sm !font-medium">
                                <button
                                    type="button"
                                    onClick={() => toggleFavouritePlayer({
                                        id: stats.player_id,
                                        name: stats.player_name,
                                        played: stats.total,
                                        wins: stats.wins,
                                    })}
                                    className={`mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 transition ${
                                        isFavourited
                                            ? 'bg-white text-[#2869fe] ring-white'
                                            : 'bg-white/15 text-white ring-white/50'
                                    }`}
                                    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                                    title={isFavourited ? 'Saved favourite' : 'Add favourite'}
                                >
                                    <Star size={11} fill={isFavourited ? 'currentColor' : 'none'} />
                                </button>
                                <MapPin size={14} />
                                <span>Local League</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-[92px] flex-col items-end">
                        <div className="flex h-16 flex-col items-center justify-center rounded-2xl bg-white text-[#2869fe] shadow-lg ring-1 ring-[#b9cdff]">
                            <span data-testid="stat-win-rate" className="text-xl tt-num">{pct}%</span>
                            <span className="tt-kicker !text-[9px] text-[#2869fe]/70">Win Rate</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span data-testid="stat-total" className="text-lg tt-num">{stats.total}</span>
                        <span className="tt-kicker !text-[10px] text-blue-100">Played</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg tt-num">{careerYears}</span>
                        <span className="tt-kicker !text-[10px] text-blue-100">Years</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg tt-num">{stats.streak || '-'}</span>
                        <span className="tt-kicker !text-[10px] text-blue-100">Streak</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg tt-num">
                            <span data-testid="stat-wins">{stats.wins}</span>W <span data-testid="stat-losses">{stats.losses}</span>L
                        </span>
                        <span className="tt-kicker !text-[10px] text-blue-100">W/L</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3 px-4">
                <button
                    type="button"
                    disabled={!stats.nemesis_id}
                    onClick={() => {
                        if (stats.nemesis_id && nemesisName) {
                            openH2H(stats.nemesis_id, nemesisName);
                        }
                    }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 p-4 text-left ring-1 ring-red-100 shadow-sm transition hover:shadow-md disabled:cursor-default disabled:opacity-80"
                >
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
                            <Swords size={16} />
                        </div>
                        <span className="tt-kicker !text-[10px] text-red-600">Nemesis</span>
                    </div>
                    <p className="tt-title-md leading-tight">
                        {nemesisName || 'None'}
                    </p>
                    {stats.nemesis && (
                        <p className="mt-1 tt-meta !text-red-500">{stats.nemesis.split('(')[1]?.replace(')', '')}</p>
                    )}
                </button>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#eef3ff] to-[#e9efff] p-4 ring-1 ring-[#d8e2ff] shadow-sm transition hover:shadow-md">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce7ff] text-[#2869fe]">
                            <Shield size={16} />
                        </div>
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Dynamic Duo</span>
                    </div>
                    <p className="tt-title-md leading-tight">
                        {stats.duo ? stats.duo.split(' (')[0] : 'None'}
                    </p>
                    {stats.duo && (
                        <p className="mt-1 tt-meta !text-[#2869fe]">{stats.duo.split('(')[1]?.replace(')', '')}</p>
                    )}
                </div>
            </div>

            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <Swords size={18} className="text-[#2869fe]" />
                    <h3 className="tt-section-title !mb-0">
                        Most Played Opponents
                    </h3>
                </div>

                {mostPlayedOpponents.length === 0 ? (
                    <div className="tt-card p-5 tt-body-sm text-slate-500">
                        No opponent history available yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {mostPlayedOpponents.map((opponent) => (
                            <button
                                key={opponent.opponent_id}
                                type="button"
                                onClick={() => openH2H(opponent.opponent_id, opponent.opponent_name)}
                                className="tt-card flex items-center justify-between px-4 py-3 text-left transition hover:-translate-y-0.5"
                            >
                                <div>
                                    <p className="tt-title-md !text-sm">{opponent.opponent_name}</p>
                                    <p className="tt-meta">
                                        {opponent.wins}W-{opponent.losses}L • {opponent.played} played
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="rounded-lg bg-[#edf3ff] px-2 py-1 tt-meta !font-extrabold !text-[#2869fe]">
                                        {opponent.win_rate}% WR
                                    </span>
                                    <span className="tt-kicker !text-[10px] text-[#2869fe]">
                                        H2H
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <Building2 size={18} className="text-[#2869fe]" />
                    <h3 className="tt-section-title !mb-0">
                        Current Season Teams & Leagues
                    </h3>
                </div>

                {affiliationsLoading ? (
                    <div className="flex justify-center p-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#2869fe]"></div>
                    </div>
                ) : affiliations.length === 0 ? (
                    <div className="tt-card p-5 tt-body-sm text-slate-500">
                        No active-season affiliations found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {affiliations.map((affiliation) => (
                            <div
                                key={`${affiliation.team_id}-${affiliation.competition_name}`}
                                className="tt-card p-4"
                            >
                                <p className="tt-title-md">{affiliation.team_name}</p>
                                <p className="mt-1 tt-meta">
                                    {affiliation.league_name} · {affiliation.competition_name}
                                </p>
                                <p className="mt-0.5 tt-caption">
                                    {affiliation.season_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#2869fe]" />
                    <h3 className="tt-section-title !mb-0">Career Timeline</h3>
                </div>
                {insightsLoading ? (
                    <div className="tt-card p-5 tt-body-sm text-slate-500">Loading career insights...</div>
                ) : !insights || insights.career_by_year.length === 0 ? (
                    <div className="tt-card p-5 tt-body-sm text-slate-500">Not enough history yet.</div>
                ) : (
                    <div className="tt-card p-4">
                        <p className="tt-meta mb-3">
                            Active for {insights.years_played} year{insights.years_played === 1 ? '' : 's'} ·
                            {' '}First match {insights.first_match_date ?? '-'}
                        </p>
                        <div className="space-y-2">
                            {insights.career_by_year.map((year) => (
                                <div key={year.year}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="tt-title-md !text-sm">{year.year}</span>
                                        <span className="tt-caption">{year.played} played · {year.win_rate}% WR</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-[#2869fe] to-[#6a8bff]"
                                            style={{ width: `${Math.min(100, year.win_rate)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3 px-4">
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Flame size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Peak Insights</span>
                    </div>
                    <p className="tt-title-md !text-sm">Best Season</p>
                    <p className="tt-meta">
                        {bestSeason ? `${bestSeason.year} · ${bestSeason.win_rate}% WR (${bestSeason.played})` : 'N/A'}
                    </p>
                    <p className="tt-title-md !text-sm mt-2">Most Active</p>
                    <p className="tt-meta">
                        {mostActiveSeason ? `${mostActiveSeason.year} · ${mostActiveSeason.played} matches` : 'N/A'}
                    </p>
                    <p className="tt-title-md !text-sm mt-2">Best / Worst Month</p>
                    <p className="tt-meta">
                        {formatMonthLabel(insights?.peaks.best_month?.month ?? null)} / {formatMonthLabel(insights?.peaks.worst_month?.month ?? null)}
                    </p>
                </div>
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Target size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Milestones</span>
                    </div>
                    <p className="tt-title-md !text-sm">Longest Win Streak</p>
                    <p className="tt-meta">{insights?.milestones.longest_win_streak ?? 0} matches</p>
                    <p className="tt-title-md !text-sm mt-2">Hits</p>
                    <p className="tt-meta">
                        {milestoneHits.length
                            ? milestoneHits.map((m) => `${m}`).join(', ')
                            : 'No milestones yet'}
                    </p>
                    <p className="tt-title-md !text-sm mt-2">Latest Match</p>
                    <p className="tt-meta">{insights?.latest_match_date ?? '-'}</p>
                </div>
            </section>

            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <Swords size={18} className="text-[#2869fe]" />
                    <h3 className="tt-section-title !mb-0">Rival Intelligence</h3>
                </div>
                <div className="tt-card p-4 space-y-2">
                    <p className="tt-meta">
                        Toughest: {insights?.rivals.toughest ? `${insights.rivals.toughest.opponent_name} (${insights.rivals.toughest.win_rate}% WR)` : 'N/A'}
                    </p>
                    <p className="tt-meta">
                        Easiest: {insights?.rivals.easiest ? `${insights.rivals.easiest.opponent_name} (${insights.rivals.easiest.win_rate}% WR)` : 'N/A'}
                    </p>
                    <p className="tt-meta">
                        Improving vs: {improvingVs ? `${improvingVs.opponent_name} (+${improvingVs.delta_points} pts)` : 'N/A'}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 px-4">
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <BarChart3 size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Style Profile</span>
                    </div>
                    <p className="tt-meta">Singles: {insights?.style.singles.played ?? 0} · {insights?.style.singles.win_rate ?? 0}% WR</p>
                    <p className="tt-meta">Doubles: {insights?.style.doubles.played ?? 0} · {insights?.style.doubles.win_rate ?? 0}% WR</p>
                    <p className="tt-title-md !text-sm mt-2">Top Score Patterns</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {(insights?.style.score_patterns ?? []).slice(0, 4).map((p) => (
                            <span key={p.score} className="rounded-lg bg-[#edf3ff] px-2 py-1 tt-caption text-[#2869fe]">
                                {p.score} ({p.count})
                            </span>
                        ))}
                    </div>
                </div>
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Building2 size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Context</span>
                    </div>
                    <p className="tt-meta">Home: {insights?.context.home.played ?? 0} · {insights?.context.home.win_rate ?? 0}% WR</p>
                    <p className="tt-meta">Away: {insights?.context.away.played ?? 0} · {insights?.context.away.win_rate ?? 0}% WR</p>
                    <p className="tt-title-md !text-sm mt-2">Top League</p>
                    <p className="tt-meta">
                        {topLeague
                            ? `${topLeague.league} (${topLeague.played})`
                            : 'N/A'}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 px-4">
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Zap size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Form & Momentum</span>
                    </div>
                    <p className="tt-meta">Rolling 10: {insights?.form.rolling_10_win_rate ?? 0}% WR</p>
                    <p className="tt-meta">Rolling 20: {insights?.form.rolling_20_win_rate ?? 0}% WR</p>
                    <p className="tt-meta">Momentum: {momentumLabel}</p>
                    <p className="tt-meta">Recent: {(insights?.form.recent_results ?? []).slice(0, 10).join(' ') || '-'}</p>
                </div>
                <div className="tt-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Target size={16} className="text-[#2869fe]" />
                        <span className="tt-kicker !text-[10px] text-[#2869fe]">Projection</span>
                    </div>
                    <p className="tt-meta">Current season: {insights?.projection.current_season_matches ?? 0} matches</p>
                    <p className="tt-meta">Current WR: {insights?.projection.current_season_win_rate ?? 0}%</p>
                    <p className="tt-meta">Projected matches: {insights?.projection.projected_matches ?? 0}</p>
                    <p className="tt-meta">70% target: {insights?.projection.on_track_for_70_win_rate ? 'On track' : 'Behind'}</p>
                </div>
            </section>

            <section className="mt-2 px-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="tt-title-lg !mb-0 flex items-center gap-2">
                        <Calendar size={20} className="text-[#2869fe]" /> Match History
                    </h3>
                </div>

                {rubbersLoading && rubbers.length === 0 ? (
                    <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#2869fe]"></div></div>
                ) : rubbers.length === 0 ? (
                    <div className="tt-card p-6 text-center tt-body-sm text-slate-500">
                        No recent matches found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {rubbers.map((rubber: import('../types').RubberItem) => (
                            <div
                                key={rubber.id}
                                className="tt-card flex items-center justify-between gap-3 p-4"
                            >
                                <button
                                    onClick={() => navigate(`/fixtures/${rubber.fixture_id}`)}
                                    className="flex flex-1 items-center gap-4 text-left transition hover:opacity-85"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${rubber.isWin ? 'bg-gradient-to-br from-[#edf3ff] to-[#dce7ff] text-[#2869fe]' : 'bg-gradient-to-br from-red-50 to-red-100 text-red-500'
                                        }`}>
                                        <Zap size={20} className={rubber.isWin ? 'text-[#2869fe]' : 'text-red-400 rotate-180'} />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`tt-kicker !text-[10px] px-1.5 py-0.5 rounded ${rubber.isWin ? 'bg-[#dce7ff] text-[#245feb]' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {rubber.isWin ? 'W' : 'L'}
                                            </span>
                                            <span className="tt-caption uppercase">{rubber.date}</span>
                                        </div>
                                        <h4 className="mt-1 tt-title-md">vs {rubber.opponent}</h4>
                                        <p className="truncate max-w-[160px] tt-caption">{rubber.league}</p>
                                    </div>
                                </button>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`tt-num ${rubber.isWin ? 'text-[#2869fe]' : 'text-slate-700'}`}>
                                        {rubber.result.replace('Won ', '').replace('Lost ', '')}
                                    </span>
                                    {rubber.opponent_id && (
                                        <button
                                            onClick={() => {
                                                if (rubber.opponent_id) {
                                                    openH2H(rubber.opponent_id, rubber.opponent);
                                                }
                                            }}
                                            className="rounded-xl bg-[#edf3ff] px-2 py-1 tt-kicker !text-[10px] text-[#2869fe]"
                                        >
                                            H2H
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {hasMoreRubbers && (
                            <button
                                onClick={() => {
                                    loadMoreScrollYRef.current = window.scrollY;
                                    setOffset((prev) => prev + PAGE_SIZE);
                                }}
                                disabled={rubbersFetching}
                                className="rounded-2xl bg-slate-100 px-4 py-3 tt-body-sm !font-bold !text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {rubbersFetching ? 'Loading...' : 'Load more matches'}
                            </button>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
