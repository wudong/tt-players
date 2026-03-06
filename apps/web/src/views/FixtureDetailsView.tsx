import { IonButton, IonCard, IonCardContent, IonIcon, IonItem, IonLabel, IonList, IonSpinner } from '@ionic/react';
import { openOutline, peopleOutline, warningOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureRubbers } from '../hooks/useFixtureRubbers';

export function FixtureDetailsView() {
    const { fixtureId = '' } = useParams<{ fixtureId: string }>();
    const navigate = useNavigate();

    const { data: rubbersData, isLoading, isError } = useFixtureRubbers(fixtureId);
    const rubbers = rubbersData?.data ?? [];
    const fixtureMeta = rubbersData?.fixture;

    const playedAtLabel = fixtureMeta?.played_at
        ? new Date(fixtureMeta.played_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : 'Time not available';

    let homeScore = 0;
    let awayScore = 0;

    rubbers.forEach((r) => {
        if (r.home_games_won > r.away_games_won) homeScore += 1;
        else if (r.away_games_won > r.home_games_won) awayScore += 1;
    });

    return (
        <div className="tt-route-scroll">
            <header className="tt-hero tt-hero-fixture">
                <p className="tt-eyebrow">Fixture Results</p>
                <h1>{fixtureMeta?.home_team_name ?? 'Home'} vs {fixtureMeta?.away_team_name ?? 'Away'}</h1>
                <p className="tt-hero-sub">{fixtureMeta?.league_name} · {fixtureMeta?.division_name}</p>
                <p className="tt-hero-sub">{playedAtLabel}</p>
                {fixtureMeta?.source_url && (
                    <IonButton href={fixtureMeta.source_url} target="_blank" rel="noreferrer" size="small" fill="outline">
                        Source <IonIcon slot="end" icon={openOutline} />
                    </IonButton>
                )}
                {!isLoading && !isError && rubbers.length > 0 && (
                    <div className="tt-score-row">
                        <strong>{homeScore}</strong>
                        <span>VS</span>
                        <strong>{awayScore}</strong>
                    </div>
                )}
            </header>

            <main className="tt-content">
                <IonCard className="tt-card">
                    <IonCardContent>
                        <h2 className="tt-section-subtitle"><IonIcon icon={peopleOutline} /> Match Breakdown</h2>

                        {isLoading ? (
                            <div className="tt-state"><IonSpinner name="crescent" /></div>
                        ) : isError ? (
                            <div className="tt-alert" role="alert">
                                <IonIcon icon={warningOutline} />
                                <p>Failed to load fixture details.</p>
                            </div>
                        ) : rubbers.length === 0 ? (
                            <p className="tt-hint">No matches found for this fixture.</p>
                        ) : (
                            <IonList lines="none" className="tt-list">
                                {rubbers.map((rubber) => {
                                    const isHomeWin = rubber.home_games_won > rubber.away_games_won;
                                    const homePlayers = [
                                        { id: rubber.home_player_1_id, name: rubber.home_player_1_name },
                                        ...(rubber.is_doubles ? [{ id: rubber.home_player_2_id, name: rubber.home_player_2_name }] : []),
                                    ].filter((player) => Boolean(player.name));
                                    const awayPlayers = [
                                        { id: rubber.away_player_1_id, name: rubber.away_player_1_name },
                                        ...(rubber.is_doubles ? [{ id: rubber.away_player_2_id, name: rubber.away_player_2_name }] : []),
                                    ].filter((player) => Boolean(player.name));

                                    return (
                                        <IonItem key={rubber.id} className="tt-list-item" lines="none">
                                            <IonLabel>
                                                <h3>{rubber.is_doubles ? 'Doubles' : 'Singles'}</h3>
                                                <p>
                                                    {(homePlayers.map((p) => p.name).join(' & ') || 'Unknown')} vs {(awayPlayers.map((p) => p.name).join(' & ') || 'Unknown')}
                                                </p>
                                                <p>
                                                    {rubber.home_games_won}-{rubber.away_games_won} ({isHomeWin ? 'Home win' : 'Away win'})
                                                </p>
                                            </IonLabel>
                                            <div className="tt-rubber-actions">
                                                {homePlayers.map((p, idx) => (
                                                    p.id ? (
                                                        <IonButton key={`h-${idx}`} size="small" fill="clear" onClick={() => navigate(`/players/${p.id}`)}>{p.name?.split(' ')[0]}</IonButton>
                                                    ) : null
                                                ))}
                                                {awayPlayers.map((p, idx) => (
                                                    p.id ? (
                                                        <IonButton key={`a-${idx}`} size="small" fill="clear" onClick={() => navigate(`/players/${p.id}`)}>{p.name?.split(' ')[0]}</IonButton>
                                                    ) : null
                                                ))}
                                            </div>
                                        </IonItem>
                                    );
                                })}
                            </IonList>
                        )}
                    </IonCardContent>
                </IonCard>
            </main>
        </div>
    );
}
