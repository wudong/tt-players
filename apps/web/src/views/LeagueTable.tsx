import { Trophy, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStandings } from '../hooks/useStandings';

interface Props {
    competitionId: string;
}

export function LeagueTable({ competitionId }: Props) {
    const { data, isLoading, isError, error } = useStandings(competitionId);
    const navigate = useNavigate();
    const standings = data?.data ?? [];
    const sourceUrl = data?.source_url ?? null;

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                <div
                    role="status"
                    aria-label="Loading league table"
                    className="animate-pulse space-y-3"
                >
                    {/* Header skeleton */}
                    <div className="h-6 w-40 rounded-lg bg-slate-200" />
                    {/* Row skeletons */}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-slate-200" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4">
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                >
                    <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
                    <p>
                        {error instanceof Error
                            ? error.message
                            : 'Failed to load standings. Please try again.'}
                    </p>
                </div>
            </div>
        );
    }

    if (standings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-slate-400">
                <Trophy size={32} strokeWidth={1.5} />
                <p className="tt-body-sm">No standings available yet</p>
            </div>
        );
    }

    return (
        <section className="p-4">
            <div className="mb-3 flex items-center gap-2">
                <Trophy size={18} className="text-[#2869fe]" />
                <h2 className="tt-section-title !mb-0">
                    League Table
                </h2>
                {sourceUrl && (
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[#edf3ff] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#2869fe]"
                    >
                        Source <ExternalLink size={12} />
                    </a>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#dbe4fa] shadow-[0_8px_24px_rgba(18,25,39,0.06)]">
                <table className="w-full border-collapse text-sm" aria-label="League standings">
                    <thead>
                        <tr className="border-b border-[#e9efff] bg-[#f4f7ff] text-xs font-extrabold uppercase tracking-[0.11em] text-slate-500">
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Team</th>
                            <th className="px-2 py-3 text-center">W</th>
                            <th className="px-2 py-3 text-center">L</th>
                            <th className="px-2 py-3 text-center">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((row, idx) => (
                            <tr
                                key={row.team_id}
                                onClick={() => navigate(`/teams/${row.team_id}`)}
                                className={`group cursor-pointer border-b border-[#edf2ff] transition-colors hover:bg-[#eef4ff] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafcff]'
                                    }`}
                            >
                                <td className="px-4 py-3 tt-num !text-sm text-slate-400">
                                    {row.position}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="tt-title-md !text-sm group-hover:text-[#2869fe] transition-colors">
                                            {row.team_name}
                                        </span>
                                        <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </td>

                                <td className="px-2 py-3 text-center tt-num !text-sm text-[#2869fe]">
                                    {row.won}
                                </td>

                                <td className="px-2 py-3 text-center tt-num !text-sm text-red-500">
                                    {row.lost}
                                </td>

                                <td className="px-2 py-3 text-center">
                                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-[#edf3ff] px-2 py-0.5 tt-num !text-xs text-[#1f57de]">
                                        {row.points}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
