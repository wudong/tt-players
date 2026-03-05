import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFixtures } from '../hooks/useFixtures';
import type { FixtureItem } from '../types';

interface Props {
    teamId: string;
    limit?: number;
    offset?: number;
    showHeading?: boolean;
}

function FixtureStatusBadge({ status }: { status: FixtureItem['status'] }) {
    const styles = {
        completed: 'bg-[#edf3ff] text-[#1e53d7]',
        upcoming: 'bg-[#f4f7ff] text-[#4b5d84]',
        postponed: 'bg-red-50 text-red-600',
    } as const;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 tt-meta !font-bold capitalize ${styles[status]}`}
        >
            {status}
        </span>
    );
}

function FixtureCard({
    fixture,
    teamId,
}: {
    fixture: FixtureItem;
    teamId: string;
}) {
    const date = new Date(fixture.date_played);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const navigate = useNavigate();
    const isHome = fixture.home_team_id === teamId;
    const opponentName = isHome ? fixture.away_team_name : fixture.home_team_name;
    const opponentFallback = fixture.status === 'upcoming' ? 'TBD' : 'Unknown opponent';
    const opponentLabel = opponentName ?? opponentFallback;
    const hasScore =
        fixture.home_score != null &&
        fixture.away_score != null &&
        fixture.status === 'completed';
    const teamScore = hasScore
        ? (isHome ? fixture.home_score : fixture.away_score)
        : null;
    const opponentScore = hasScore
        ? (isHome ? fixture.away_score : fixture.home_score)
        : null;
    const outcomeLabel = !hasScore
        ? null
        : teamScore! > opponentScore!
            ? 'W'
            : teamScore! < opponentScore!
                ? 'L'
                : 'D';

    return (
        <button
            onClick={() => navigate(`/fixtures/${fixture.id}`)}
            data-testid="fixture-item"
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-[#dbe4fa] shadow-[0_8px_24px_rgba(18,25,39,0.06)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
        >
            <div className="flex shrink-0 flex-col items-center rounded-xl bg-[#f4f7ff] px-3 py-2 text-center">
                <CalendarDays size={14} className="mb-1 text-[#2869fe]" />
                <span
                    data-testid="fixture-date"
                    className="tt-meta !font-bold text-slate-600"
                >
                    {formattedDate}
                </span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate tt-title-md !text-sm !text-slate-600">
                    {opponentLabel}
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex flex-col">
                        {fixture.round_name && (
                            <span className="tt-caption">{fixture.round_name}</span>
                        )}
                        {hasScore && (
                            <span
                                data-testid="fixture-result"
                                className="tt-meta text-slate-600"
                            >
                                {outcomeLabel} {teamScore}-{opponentScore}
                            </span>
                        )}
                    </div>
                    <FixtureStatusBadge status={fixture.status} />
                </div>
            </div>
        </button>
    );
}

export function Dashboard({ teamId, limit = 20, offset = 0, showHeading = true }: Props) {
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
                <p className="tt-body-sm text-center">
                    {data?.availability === 'source_data_missing'
                        ? 'Match data is not available for this source yet'
                        : 'No recent matches found'}
                </p>
            </div>
        );
    }

    return (
        <section className="p-4">
            {showHeading && (
                <div className="mb-3 flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#2869fe]" />
                    <h2 className="tt-section-title !mb-0">
                        Recent Matches
                    </h2>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {fixtures.map((fixture) => (
                    <FixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        teamId={teamId}
                    />
                ))}
            </div>
        </section>
    );
}
