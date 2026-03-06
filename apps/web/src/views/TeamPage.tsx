import { IonBadge, IonCard, IonCardContent, IonChip, IonIcon, IonItem, IonLabel, IonList, IonSpinner } from '@ionic/react';
import { pulseOutline, chevronForwardOutline, peopleOutline, shieldOutline, statsChartOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTeamForm } from '../hooks/useTeamForm';
import { useTeamRoster } from '../hooks/useTeamRoster';
import { useTeamSummary } from '../hooks/useTeamSummary';
import type { RosterItem } from '../types';
import { Dashboard } from './Dashboard';

export function TeamPage() {
    const { teamId = '' } = useParams<{ teamId: string }>();
    const navigate = useNavigate();

    const { data: rosterData, isLoading: rosterLoading } = useTeamRoster(teamId);
    const { data: formData, isLoading: formLoading } = useTeamForm(teamId);
    const { data: summary } = useTeamSummary(teamId);

    const roster = rosterData?.data ?? [];
    const rosterAvailability = rosterData?.availability;
    const form = formData ?? null;
    const teamName = summary?.name ?? 'Team Hub';

    return (
        <div className="tt-route-scroll">
            <header className="tt-hero tt-hero-team">
                <p className="tt-eyebrow">Team Profile</p>
                <h1><IonIcon icon={shieldOutline} /> {teamName}</h1>
                <div className="tt-meta-grid">
                    <IonChip>{summary?.league_name ?? '-'}</IonChip>
                    <IonChip>{summary?.competition_name ?? '-'}</IonChip>
                    <IonChip>{summary?.season_name ?? '-'}</IonChip>
                </div>
                {!formLoading && form && (
                    <div className="tt-hero-stats">
                        <div>
                            <small>Position</small>
                            <strong>{form.position ?? '-'}</strong>
                        </div>
                        <div>
                            <small>Points</small>
                            <strong>{form.points ?? '-'}</strong>
                        </div>
                    </div>
                )}
            </header>

            <main className="tt-content">
                {!formLoading && form && form.form.length > 0 && (
                    <IonCard className="tt-card">
                        <IonCardContent>
                            <h2 className="tt-section-subtitle"><IonIcon icon={pulseOutline} /> Recent Form</h2>
                            <div className="tt-form-row">
                                {form.form.map((result, idx) => (
                                    <IonBadge key={idx} className={`tt-form-badge tt-form-${result.toLowerCase()}`}>{result}</IonBadge>
                                ))}
                            </div>
                        </IonCardContent>
                    </IonCard>
                )}

                <IonCard className="tt-card">
                    <IonCardContent>
                        <h2 className="tt-section-subtitle"><IonIcon icon={peopleOutline} /> Squad Roster</h2>
                        {rosterLoading ? (
                            <div className="tt-state"><IonSpinner name="crescent" /></div>
                        ) : roster.length === 0 ? (
                            <p className="tt-hint">
                                {rosterAvailability === 'source_data_missing'
                                    ? 'Roster data is not available for this source yet.'
                                    : 'No players found for this team yet.'}
                            </p>
                        ) : (
                            <IonList lines="none" className="tt-list">
                                {roster.map((player: RosterItem) => (
                                    <IonItem
                                        key={player.id}
                                        button
                                        detail={false}
                                        className="tt-list-item"
                                        onClick={() => navigate(`/players/${player.id}`)}
                                    >
                                        <div className="tt-avatar">{player.name.slice(0, 2).toUpperCase()}</div>
                                        <IonLabel>
                                            <h3>{player.name}</h3>
                                            <p>{player.played} matches played</p>
                                        </IonLabel>
                                        <div className="tt-right-meta">
                                            <strong>{player.winRate}%</strong>
                                            <small>Win Rate</small>
                                        </div>
                                        <IonIcon icon={chevronForwardOutline} className="tt-item-arrow" />
                                    </IonItem>
                                ))}
                            </IonList>
                        )}
                    </IonCardContent>
                </IonCard>

                <IonCard className="tt-card">
                    <IonCardContent>
                        <h2 className="tt-section-subtitle"><IonIcon icon={statsChartOutline} /> Recent Matches</h2>
                        <Dashboard teamId={teamId} showHeading={false} />
                    </IonCardContent>
                </IonCard>
            </main>
        </div>
    );
}
