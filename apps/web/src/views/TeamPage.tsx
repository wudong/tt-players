import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Users, ChevronRight, ActivitySquare } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { useTeamRoster } from '../hooks/useTeamRoster';
import { useTeamForm } from '../hooks/useTeamForm';
import { useTeamSummary } from '../hooks/useTeamSummary';
import { RosterItem } from '../types';
import { PressButton } from '../ui/PressButton';

export function TeamPage() {
    const { teamId = '' } = useParams<{ teamId: string }>();
    const navigate = useNavigate();

    const { data: rosterData, isLoading: rosterLoading } = useTeamRoster(teamId);
    const { data: formData, isLoading: formLoading } = useTeamForm(teamId);
    const { data: summary } = useTeamSummary(teamId);

    const roster = rosterData?.data || [];
    const rosterAvailability = rosterData?.availability;
    const form = formData || null;
    const teamName = summary?.name ?? 'Team Hub';

    return (
        <div className="flex min-h-screen flex-col bg-transparent pb-28">
            <header className="tt-hero tt-hero-team">
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/40 backdrop-blur-sm shadow-xl">
                        <Shield className="text-white" size={32} />
                    </div>
                    <span className="mb-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 tt-kicker text-blue-100 backdrop-blur-sm">
                        Team Profile
                    </span>
                    <h1 className="tt-hero-title !text-[2rem] text-white drop-shadow-md">
                        {teamName}
                    </h1>
                    <div className="mt-3 grid w-full max-w-xl grid-cols-3 gap-2 text-left">
                        <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 backdrop-blur-sm">
                            <div className="tt-kicker text-blue-100">League</div>
                            <div className="truncate tt-meta text-white">
                                {summary?.league_name ?? '-'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 backdrop-blur-sm">
                            <div className="tt-kicker text-blue-100">Division</div>
                            <div className="truncate tt-meta text-white">
                                {summary?.competition_name ?? '-'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 backdrop-blur-sm">
                            <div className="tt-kicker text-blue-100">Season</div>
                            <div className="truncate tt-meta text-white">
                                {summary?.season_name ?? '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Highlights Bar */}
                {!formLoading && form && (
                    <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/15 p-4 backdrop-blur-md ring-1 ring-white/25 shadow-xl">
                        <div className="flex flex-col items-center border-r border-white/15">
                            <span className="tt-kicker text-blue-100">Position</span>
                            <span className="text-2xl tt-num text-white">{form.position ?? '-'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="tt-kicker text-blue-100">Points</span>
                            <span className="text-2xl tt-num text-white">{form.points ?? '-'}</span>
                        </div>
                    </div>
                )}
            </header>

            <div className="px-5 flex flex-col gap-6 mt-6">
                {!formLoading && form && form.form.length > 0 && (
                    <section className="tt-card animate-in p-4 slide-in-from-bottom-4 duration-500">
                        <div className="mb-3 flex items-center gap-2">
                            <ActivitySquare size={18} className="text-[#2869fe]" />
                            <h2 className="tt-section-title !mb-0">Recent Form</h2>
                        </div>
                        <div className="flex justify-between rounded-[1rem] bg-[#f5f8ff] p-3 ring-1 ring-[#e7ecfa]">
                            {form.form.map((result: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl tt-num !text-sm shadow-inner
                                        ${result === 'W' ? 'bg-[#dce7ff] text-[#245feb] ring-1 ring-[#b9cdff]'
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

                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="mb-3 flex items-center gap-2">
                        <Users size={18} className="text-[#2869fe]" />
                        <h2 className="tt-section-title !mb-0">Squad Roster</h2>
                    </div>

                    {rosterLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {roster.length === 0 ? (
                                <div className="tt-card p-6 text-center tt-body-sm text-slate-500">
                                    {rosterAvailability === 'source_data_missing'
                                        ? 'Roster data is not available for this source yet.'
                                        : 'No players found for this team yet.'}
                                </div>
                            ) : (
                                roster.map((player: RosterItem) => (
                                    <PressButton
                                        key={player.id}
                                        onClick={() => navigate(`/players/${player.id}`)}
                                        className="tt-card flex items-center justify-between p-4 transition hover:-translate-y-0.5 active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] font-bold text-[#2869fe]">
                                                {player.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <div className="tt-title-md !text-sm">{player.name}</div>
                                                <div className="tt-caption">
                                                    {player.played} matches played
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <div className="tt-num text-[#2869fe]">{player.winRate}%</div>
                                                <div className="tt-kicker text-slate-400">Win Rate</div>
                                            </div>
                                            <ChevronRight className="text-slate-300" size={18} />
                                        </div>
                                    </PressButton>
                                ))
                            )}
                        </div>
                    )}
                </section>

                <section className="tt-card animate-in mt-2 slide-in-from-bottom-4 duration-500 delay-200">
                    <Dashboard teamId={teamId} showHeading={false} />
                </section>
            </div>
        </div>
    );
}
