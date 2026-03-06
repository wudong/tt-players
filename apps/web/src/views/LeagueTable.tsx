import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { chevronForwardOutline, openOutline, trophyOutline, warningOutline } from 'ionicons/icons';
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
            <div role="status" aria-label="Loading league table">
                <IonSpinner name="crescent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div role="alert">
                <IonIcon icon={warningOutline} />
                <p>{error instanceof Error ? error.message : 'Failed to load standings. Please try again.'}</p>
            </div>
        );
    }

    if (standings.length === 0) {
        return (
            <div>
                <IonIcon icon={trophyOutline} />
                <p>No standings available yet</p>
            </div>
        );
    }

    return (
        <section>
            <div>
                <h2><IonIcon icon={trophyOutline} /> League Table</h2>
                {sourceUrl && (
                    <IonButton href={sourceUrl} target="_blank" rel="noreferrer" size="small" fill="outline">
                        Source <IonIcon slot="end" icon={openOutline} />
                    </IonButton>
                )}
            </div>

            <div>
                <table aria-label="League standings">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Team</th>
                            <th>W</th>
                            <th>L</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((row) => (
                            <tr key={row.team_id} onClick={() => navigate(`/teams/${row.team_id}`)}>
                                <td>{row.position}</td>
                                <td>
                                    <span>{row.team_name}</span>
                                    <IonIcon icon={chevronForwardOutline} />
                                </td>
                                <td>{row.won}</td>
                                <td>{row.lost}</td>
                                <td><span>{row.points}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
