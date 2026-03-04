import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Users, ChevronRight, ActivitySquare } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { useTeamRoster } from '../hooks/useTeamRoster';
import { useTeamForm } from '../hooks/useTeamForm';
import { RosterItem } from '../types';

export function TeamPage() {
    const { teamId = '' } = useParams<{ teamId: string }>();
    const navigate = useNavigate();

    const { data: rosterData, isLoading: rosterLoading } = useTeamRoster(teamId);
    const { data: formData, isLoading: formLoading } = useTeamForm(teamId);

    const roster = rosterData?.data || [];
    const rosterAvailability = rosterData?.availability;
    const form = formData || null;

    return (
        <div className="flex flex-col pb-28 min-h-screen bg-slate-50">
            {/* Header */}
            <header className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-indigo-700 via-indigo-900 to-black px-5 pb-8 pt-12 shadow-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <button
                    onClick={() => navigate(-1)}
                    className="relative z-10 mb-6 flex items-center gap-1.5 text-sm font-semibold text-indigo-100 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-xl">
                        <Shield className="text-white" size={32} />
                    </div>
                    <span className="mb-2 rounded-full bg-indigo-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-100 backdrop-blur-sm border border-indigo-400/20">
                        Team Profile
                    </span>
                    <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
                        Team Hub
                    </h1>
                </div>

                {/* Performance Highlights Bar */}
                {!formLoading && form && (
                    <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                        <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Position</span>
                            <span className="text-2xl font-black text-white">{form.position ?? '-'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Points</span>
                            <span className="text-2xl font-black text-white">{form.points ?? '-'}</span>
                        </div>
                    </div>
                )}
            </header>

            <div className="px-5 flex flex-col gap-6 mt-6">
                {/* Form Guide */}
                {!formLoading && form && form.form.length > 0 && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-3 flex items-center gap-2">
                            <ActivitySquare size={18} className="text-indigo-500" />
                            <h2 className="text-sm font-bold text-slate-800">Recent Form</h2>
                        </div>
                        <div className="flex justify-between rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                            {form.form.map((result: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shadow-inner
                                        ${result === 'W' ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200'
                                            : result === 'L' ? 'bg-red-100 text-red-600 ring-1 ring-red-200'
                                                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}
                                >
                                    {result}
                                </div>
                            ))}
                            {/* Fill empty slots with placeholders up to 5 */}
                            {Array.from({ length: Math.max(0, 5 - form.form.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 opacity-50 text-slate-300">
                                    -
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Squad Roster */}
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="mb-3 flex items-center gap-2">
                        <Users size={18} className="text-indigo-500" />
                        <h2 className="text-sm font-bold text-slate-800">Squad Roster</h2>
                    </div>

                    {rosterLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {roster.length === 0 ? (
                                <div className="rounded-[1.5rem] bg-white p-6 text-center text-sm font-medium text-slate-500 ring-1 ring-slate-100">
                                    {rosterAvailability === 'source_data_missing'
                                        ? 'Roster data is not available for this source yet.'
                                        : 'No players found for this team yet.'}
                                </div>
                            ) : (
                                roster.map((player: RosterItem) => (
                                    <button
                                        key={player.id}
                                        onClick={() => navigate(`/players/${player.id}`)}
                                        className="flex items-center justify-between rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600">
                                                {player.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-800">{player.name}</div>
                                                <div className="text-[11px] font-semibold text-slate-400">
                                                    {player.played} matches played
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <div className="font-black text-indigo-600">{player.winRate}%</div>
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Win Rate</div>
                                            </div>
                                            <ChevronRight className="text-slate-300" size={18} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </section>

                {/* Fixtures Feed */}
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200 mt-2">
                    <Dashboard teamId={teamId} />
                </section>
            </div>
        </div>
    );
}
