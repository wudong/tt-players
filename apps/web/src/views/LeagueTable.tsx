import { Trophy } from 'lucide-react';
import { useStandings } from '../hooks/useStandings';

interface Props {
    competitionId: string;
}

export function LeagueTable({ competitionId }: Props) {
    const { data, isLoading, isError, error } = useStandings(competitionId);

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

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-slate-400">
                <Trophy size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium">No standings available yet</p>
            </div>
        );
    }

    return (
        <section className="p-4">
            {/* Section header */}
            <div className="mb-3 flex items-center gap-2">
                <Trophy size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    League Table
                </h2>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full border-collapse text-sm" aria-label="League standings">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Team</th>
                            <th className="px-2 py-3 text-center">W</th>
                            <th className="px-2 py-3 text-center">L</th>
                            <th className="px-2 py-3 text-center">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr
                                key={row.team_id}
                                className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                    }`}
                            >
                                {/* Position */}
                                <td className="px-4 py-3 font-bold text-slate-400">
                                    {row.position}
                                </td>

                                {/* Team name */}
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                    {row.team_name}
                                </td>

                                {/* Won */}
                                <td className="px-2 py-3 text-center font-medium text-emerald-600">
                                    {row.won}
                                </td>

                                {/* Lost */}
                                <td className="px-2 py-3 text-center font-medium text-red-500">
                                    {row.lost}
                                </td>

                                {/* Points */}
                                <td className="px-2 py-3 text-center">
                                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
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
