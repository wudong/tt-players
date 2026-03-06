import { MapPin, Swords, Shield, Zap, Calendar, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayerExtendedStats } from '../hooks/usePlayerExtendedStats';
import { usePlayerRubbers } from '../hooks/usePlayerRubbers';
import { usePlayerCurrentSeasonAffiliations } from '../hooks/usePlayerCurrentSeasonAffiliations';
import { winPercentage } from '../types';
import { useNavigate } from 'react-router-dom';

interface Props {
    playerId: string;
}

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export function PlayerProfile({ playerId }: Props) {
    const PAGE_SIZE = 20;
    const navigate = useNavigate();
    const { data: stats, isLoading: statsLoading, isError: statsError } = usePlayerExtendedStats(playerId);
    const { data: affiliationsData, isLoading: affiliationsLoading } = usePlayerCurrentSeasonAffiliations(playerId);
    const [offset, setOffset] = useState(0);
    const [rubbers, setRubbers] = useState<import('../types').RubberItem[]>([]);
    const {
        data: rubbersData,
        isLoading: rubbersLoading,
        isFetching: rubbersFetching,
    } = usePlayerRubbers(playerId, { limit: PAGE_SIZE, offset });

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
    }, [rubbersData, offset]);

    if (statsLoading) {
        return (
            <div className="flex flex-col gap-6 p-4 animate-pulse">
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
                <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-700">
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

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
            {/* Header with player summary */}
            <header className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 px-4 pb-8 pt-12 text-white shadow-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-md ring-1 ring-white/40 shadow-inner">
                            {getInitials(stats.player_name)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight">{stats.player_name}</h2>
                            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-100/90">
                                <MapPin size={14} /> <span>Local League</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-lg ring-1 ring-emerald-500/20">
                        <span className="text-lg font-black">{pct}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Win Rate</span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg font-bold">{stats.total}</span>
                        <span className="text-[10px] font-semibold tracking-wider text-emerald-100">PLAYED</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg font-bold">{stats.streak || '-'}</span>
                        <span className="text-[10px] font-semibold tracking-wider text-emerald-100">STREAK</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl bg-black/10 py-2 backdrop-blur-sm">
                        <span className="text-lg font-bold">{stats.wins}W {stats.losses}L</span>
                        <span className="text-[10px] font-semibold tracking-wider text-emerald-100">W/L</span>
                    </div>
                </div>
            </header>

            {/* Current season affiliations */}
            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <Building2 size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Current Season Teams & Leagues
                    </h3>
                </div>

                {affiliationsLoading ? (
                    <div className="flex justify-center p-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : affiliations.length === 0 ? (
                    <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                        No active-season affiliations found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {affiliations.map((affiliation) => (
                            <div
                                key={`${affiliation.team_id}-${affiliation.competition_name}`}
                                className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm"
                            >
                                <p className="font-bold text-slate-800">{affiliation.team_name}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {affiliation.league_name} · {affiliation.competition_name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    {affiliation.season_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Nemesis & Duo Cards */}
            <div className="grid grid-cols-2 gap-4 px-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 p-4 ring-1 ring-red-100 shadow-sm transition hover:shadow-md">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
                            <Swords size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600">Nemesis</span>
                    </div>
                    <p className="font-bold text-slate-800 leading-tight">
                        {stats.nemesis ? stats.nemesis.split(' (')[0] : 'None'}
                    </p>
                    {stats.nemesis && (
                        <p className="mt-1 text-xs font-semibold text-red-500">{stats.nemesis.split('(')[1]?.replace(')', '')}</p>
                    )}
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100 shadow-sm transition hover:shadow-md">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Shield size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Dynamic Duo</span>
                    </div>
                    <p className="font-bold text-slate-800 leading-tight">
                        {stats.duo ? stats.duo.split(' (')[0] : 'None'}
                    </p>
                    {stats.duo && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">{stats.duo.split('(')[1]?.replace(')', '')}</p>
                    )}
                </div>
            </div>

            {/* Most played opponents */}
            <section className="px-4">
                <div className="mb-3 flex items-center gap-2">
                    <Swords size={18} className="text-indigo-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Most Played Opponents
                    </h3>
                </div>

                {stats.most_played_opponents.length === 0 ? (
                    <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                        No opponent history available yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {stats.most_played_opponents.map((opponent) => (
                            <div
                                key={opponent.opponent_id}
                                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100 shadow-sm"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{opponent.opponent_name}</p>
                                    <p className="text-xs font-semibold text-slate-500">
                                        {opponent.wins}W-{opponent.losses}L • {opponent.played} played
                                    </p>
                                </div>
                                <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                                    {opponent.win_rate}% WR
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Recent Matches */}
            <section className="mt-2 px-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-500" /> Match History
                    </h3>
                </div>

                {rubbersLoading ? (
                    <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500"></div></div>
                ) : rubbers.length === 0 ? (
                    <div className="text-center p-6 text-sm text-slate-500 bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm">
                        No recent matches found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {rubbers.map((rubber: import('../types').RubberItem) => (
                            <div
                                key={rubber.id}
                                className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                            >
                                <button
                                    onClick={() => navigate(`/fixtures/${rubber.fixture_id}`)}
                                    className="flex flex-1 items-center gap-4 text-left transition hover:opacity-85"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${rubber.isWin ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' : 'bg-gradient-to-br from-red-50 to-red-100 text-red-500'
                                        }`}>
                                        <Zap size={20} className={rubber.isWin ? 'text-emerald-500' : 'text-red-400 rotate-180'} />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${rubber.isWin ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {rubber.isWin ? 'W' : 'L'}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{rubber.date}</span>
                                        </div>
                                        <h4 className="mt-1 font-bold text-slate-800">vs {rubber.opponent}</h4>
                                        <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[160px]">{rubber.league}</p>
                                    </div>
                                </button>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`font-black tracking-tight ${rubber.isWin ? 'text-emerald-600' : 'text-slate-700'}`}>
                                        {rubber.result.replace('Won ', '').replace('Lost ', '')}
                                    </span>
                                    {rubber.opponent_id && (
                                        <button
                                            onClick={() => navigate('/h2h', {
                                                state: {
                                                    playerA: {
                                                        id: stats.player_id,
                                                        name: stats.player_name,
                                                        played: stats.total,
                                                        wins: stats.wins,
                                                    },
                                                    playerB: {
                                                        id: rubber.opponent_id,
                                                        name: rubber.opponent,
                                                        played: 0,
                                                        wins: 0,
                                                    },
                                                },
                                            })}
                                            className="rounded-xl bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700"
                                        >
                                            H2H
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {hasMoreRubbers && (
                            <button
                                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                                disabled={rubbersFetching}
                                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
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
