import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFixtures } from '../hooks/useFixtures';
import type { FixtureItem } from '../types';

interface Props {
    teamId: string;
    limit?: number;
    offset?: number;
}

function FixtureStatusBadge({ status }: { status: FixtureItem['status'] }) {
    const styles = {
        completed: 'bg-slate-100 text-slate-600',
        upcoming: 'bg-emerald-50 text-emerald-700',
        postponed: 'bg-red-50 text-red-600',
    } as const;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
        >
            {status}
        </span>
    );
}

function FixtureCard({ fixture }: { fixture: FixtureItem }) {
    const date = new Date(fixture.date_played);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/fixtures/${fixture.id}`)}
            data-testid="fixture-item"
            className="flex items-center gap-3 w-full text-left rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md active:scale-[0.98]"
        >
            {/* Date */}
            <div className="flex shrink-0 flex-col items-center rounded-xl bg-slate-50 px-3 py-2 text-center">
                <CalendarDays size={14} className="mb-1 text-slate-400" />
                <span
                    data-testid="fixture-date"
                    className="text-xs font-semibold text-slate-600"
                >
                    {formattedDate}
                </span>
            </div>

            {/* Teams */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-slate-500">
                        {fixture.home_team_id ?? 'TBD'}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-slate-300">vs</span>
                    <span className="truncate text-right text-xs font-medium text-slate-500">
                        {fixture.away_team_id ?? 'TBD'}
                    </span>
                </div>

                {/* Round + status */}
                <div className="mt-1.5 flex items-center justify-between">
                    {fixture.round_name && (
                        <span className="text-xs text-slate-400">{fixture.round_name}</span>
                    )}
                    <FixtureStatusBadge status={fixture.status} />
                </div>
            </div>
        </button>
    );
}

export function Dashboard({ teamId, limit = 20, offset = 0 }: Props) {
    const { data, isLoading, isError, error } = useFixtures(teamId, { limit, offset });
    const fixtures = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                <div
                    role="status"
                    aria-label="Loading recent matches"
                    className="animate-pulse space-y-3"
                >
                    <div className="h-6 w-40 rounded-lg bg-slate-200" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-slate-200" />
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
                            : 'Failed to load fixtures. Please try again.'}
                    </p>
                </div>
            </div>
        );
    }

    if (!data || fixtures.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-slate-400">
                <CalendarDays size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium">
                    {data?.availability === 'source_data_missing'
                        ? 'Match data is not available for this source yet'
                        : 'No recent matches found'}
                </p>
            </div>
        );
    }

    return (
        <section className="p-4">
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Recent Matches
                </h2>
            </div>

            {/* Fixture list */}
            <div className="flex flex-col gap-3">
                {fixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
            </div>
        </section>
    );
}
