import { MapPin, Swords, Shield, Zap, Calendar } from 'lucide-react';
import { usePlayerExtendedStats } from '../hooks/usePlayerExtendedStats';
import { usePlayerRubbers } from '../hooks/usePlayerRubbers';
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
    const navigate = useNavigate();
    const { data: stats, isLoading: statsLoading, isError: statsError } = usePlayerExtendedStats(playerId);
    const { data: rubbersData, isLoading: rubbersLoading } = usePlayerRubbers(playerId);

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
    const rubbers = rubbersData?.data || [];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300 px-4 mt-6">
            {/* Header Profile Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 p-6 text-white shadow-xl shadow-emerald-900/20">
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
            </div>

            {/* Nemesis & Duo Cards */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Recent Matches */}
            <section className="mt-2">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-500" /> Recent Matches
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
                        {rubbers.slice(0, 5).map((rubber: import('../types').RubberItem) => (
                            <button
                                key={rubber.id}
                                onClick={() => navigate(`/fixtures/${rubber.fixture_id}`)}
                                className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:scale-[1.01]"
                            >
                                <div className="flex items-center gap-4">
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
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`font-black tracking-tight ${rubber.isWin ? 'text-emerald-600' : 'text-slate-700'}`}>
                                        {rubber.result.replace('Won ', '').replace('Lost ', '')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
