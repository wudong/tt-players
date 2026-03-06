import { IonBadge, IonIcon, IonItem, IonLabel, IonList, IonSpinner } from '@ionic/react';
import { calendarOutline, warningOutline } from 'ionicons/icons';
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
    return <IonBadge className={`tt-status tt-status-${status}`}>{status}</IonBadge>;
}

function FixtureCard({ fixture, teamId }: { fixture: FixtureItem; teamId: string }) {
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
        fixture.home_score != null && fixture.away_score != null && fixture.status === 'completed';

    const teamScore = hasScore ? (isHome ? fixture.home_score : fixture.away_score) : null;
    const opponentScore = hasScore ? (isHome ? fixture.away_score : fixture.home_score) : null;

    const outcomeLabel = !hasScore
        ? null
        : teamScore! > opponentScore!
            ? 'W'
            : teamScore! < opponentScore!
                ? 'L'
                : 'D';

    return (
        <IonItem
            button
            detail={false}
            onClick={() => navigate(`/fixtures/${fixture.id}`)}
            data-testid="fixture-item"
            className="tt-list-item"
        >
            <div className="tt-fixture-datebox">
                <IonIcon icon={calendarOutline} />
                <span data-testid="fixture-date">{formattedDate}</span>
            </div>
            <IonLabel>
                <h3>{opponentLabel}</h3>
                <p>{fixture.round_name ?? 'Round TBD'}</p>
                {hasScore && (
                    <p data-testid="fixture-result">
                        {outcomeLabel} {teamScore}-{opponentScore}
                    </p>
                )}
            </IonLabel>
            <FixtureStatusBadge status={fixture.status} />
        </IonItem>
    );
}

export function Dashboard({ teamId, limit = 20, offset = 0, showHeading = true }: Props) {
    const { data, isLoading, isError, error } = useFixtures(teamId, { limit, offset });
    const fixtures = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="tt-state" role="status" aria-label="Loading recent matches">
                <IonSpinner name="crescent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="tt-alert" role="alert">
                <IonIcon icon={warningOutline} />
                <p>{error instanceof Error ? error.message : 'Failed to load fixtures. Please try again.'}</p>
            </div>
        );
    }

    if (!data || fixtures.length === 0) {
        return (
            <div className="tt-state tt-state-muted">
                <IonIcon icon={calendarOutline} />
                <p>
                    {data?.availability === 'source_data_missing'
                        ? 'Match data is not available for this source yet'
                        : 'No recent matches found'}
                </p>
            </div>
        );
    }

    return (
        <section className="tt-section">
            {showHeading && <h2 className="tt-section-title">Recent Matches</h2>}
            <IonList lines="none" className="tt-list">
                {fixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} teamId={teamId} />
                ))}
            </IonList>
        </section>
    );
}
