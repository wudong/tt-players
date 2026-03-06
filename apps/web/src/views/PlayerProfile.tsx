import {
    IonButton,
    IonCard,
    IonCardContent,
    IonChip,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
} from '@ionic/react';
import {
    calendarOutline,
    flameOutline,
    gitCompareOutline,
    heartOutline,
    heartSharp,
    trophyOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavouritePlayers } from '../hooks/useFavouritePlayers';
import { usePlayerCurrentSeasonAffiliations } from '../hooks/usePlayerCurrentSeasonAffiliations';
import { usePlayerExtendedStats } from '../hooks/usePlayerExtendedStats';
import { usePlayerInsights } from '../hooks/usePlayerInsights';
import { usePlayerRubbers } from '../hooks/usePlayerRubbers';
import { winPercentage } from '../types';

interface Props {
    playerId: string;
}

function parseNamePair(text: string | null) {
    if (!text) return { name: 'N/A', meta: '' };
    const [name, meta] = text.split('(');
    return { name: name.trim(), meta: meta?.replace(')', '').trim() ?? '' };
}

export function PlayerProfile({ playerId }: Props) {
    const PAGE_SIZE = 20;
    const navigate = useNavigate();
    const { isFavouritePlayer, toggleFavouritePlayer } = useFavouritePlayers();

    const { data: stats, isLoading: statsLoading, isError: statsError } = usePlayerExtendedStats(playerId);
    const { data: insights, isLoading: insightsLoading } = usePlayerInsights(playerId);
    const { data: affiliationsData, isLoading: affiliationsLoading } = usePlayerCurrentSeasonAffiliations(playerId);

    const [offset, setOffset] = useState(0);
    const [rubbers, setRubbers] = useState<import('../types').RubberItem[]>([]);

    const {
        data: rubbersData,
        isLoading: rubbersLoading,
        isFetching: rubbersFetching,
    } = usePlayerRubbers(playerId, { limit: PAGE_SIZE, offset });

    useEffect(() => {
        setOffset(0);
        setRubbers([]);
    }, [playerId]);

    useEffect(() => {
        if (!rubbersData) return;
        setRubbers((prev) => {
            if (offset === 0) return rubbersData.data;
            const existingIds = new Set(prev.map((item) => item.id));
            return [...prev, ...rubbersData.data.filter((item) => !existingIds.has(item.id))];
        });
    }, [rubbersData, offset]);

    if (statsLoading) {
        return (
            <div role="status" aria-label="Loading player profile">
                <IonSpinner name="crescent" />
            </div>
        );
    }

    if (statsError || !stats) {
        return (
            <div role="alert">
                <IonIcon icon={trophyOutline} />
                <p>Failed to load player profile.</p>
            </div>
        );
    }

    const pct = winPercentage(stats);
    const totalRubbers = rubbersData?.total ?? 0;
    const hasMoreRubbers = rubbers.length < totalRubbers;
    const affiliations = affiliationsData?.data ?? [];

    const nemesis = parseNamePair(stats.nemesis);
    const duo = parseNamePair(stats.duo);

    const openH2H = (opponentId: string, opponentName: string) => {
        navigate('/h2h', {
            state: {
                playerA: {
                    id: stats.player_id,
                    name: stats.player_name,
                    played: stats.total,
                    wins: stats.wins,
                },
                playerB: {
                    id: opponentId,
                    name: opponentName,
                    played: 0,
                    wins: 0,
                },
            },
        });
    };

    return (
        <div>
            <header>
                <p>Player Profile</p>
                <h1>{stats.player_name}</h1>
                <div>
                    <IonButton
                        fill="clear"
                       
                        onClick={() => toggleFavouritePlayer({
                            id: stats.player_id,
                            name: stats.player_name,
                            played: stats.total,
                            wins: stats.wins,
                        })}
                        aria-label={isFavouritePlayer(stats.player_id) ? 'Remove from favourites' : 'Add to favourites'}
                    >
                        <IonIcon icon={isFavouritePlayer(stats.player_id) ? heartSharp : heartOutline} />
                    </IonButton>
                    <IonChip>{stats.streak || '-'}</IonChip>
                </div>

                <div>
                    <div>
                        <small>Win Rate</small>
                        <strong data-testid="stat-win-rate">{pct}%</strong>
                    </div>
                    <div>
                        <small>Total</small>
                        <strong data-testid="stat-total">{stats.total}</strong>
                    </div>
                    <div>
                        <small>Wins</small>
                        <strong data-testid="stat-wins">{stats.wins}</strong>
                    </div>
                    <div>
                        <small>Losses</small>
                        <strong data-testid="stat-losses">{stats.losses}</strong>
                    </div>
                </div>
            </header>

            <main>
                <IonCard>
                    <IonCardContent>
                        <h2><IonIcon icon={gitCompareOutline} /> Matchups</h2>
                        <div>
                            <div>
                                <h4>Nemesis</h4>
                                <p>{nemesis.name}</p>
                                {nemesis.meta ? <small>{nemesis.meta}</small> : null}
                                {stats.nemesis_id && nemesis.name !== 'N/A' && (
                                    <IonButton size="small" fill="outline" onClick={() => openH2H(stats.nemesis_id!, nemesis.name)}>
                                        View H2H
                                    </IonButton>
                                )}
                            </div>
                            <div>
                                <h4>Dynamic Duo</h4>
                                <p>{duo.name}</p>
                                {duo.meta ? <small>{duo.meta}</small> : null}
                            </div>
                        </div>
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2>Career Timeline</h2>
                        {insightsLoading ? (
                            <p>Loading career insights...</p>
                        ) : !insights || insights.career_by_year.length === 0 ? (
                            <p>Not enough history yet.</p>
                        ) : (
                            <IonList lines="none">
                                {insights.career_by_year.map((year) => (
                                    <IonItem key={year.year} lines="none">
                                        <IonLabel>
                                            <h3>{year.year}</h3>
                                            <p>{year.played} played · {year.win_rate}% WR</p>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        )}
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2>Rival Intelligence</h2>
                        <p>
                            Toughest: {insights?.rivals.toughest ? `${insights.rivals.toughest.opponent_name} (${insights.rivals.toughest.win_rate}% WR)` : 'N/A'}
                        </p>
                        <p>
                            Easiest: {insights?.rivals.easiest ? `${insights.rivals.easiest.opponent_name} (${insights.rivals.easiest.win_rate}% WR)` : 'N/A'}
                        </p>
                        <p>
                            Improving vs: {insights?.rivals.improving_vs ? `${insights.rivals.improving_vs.opponent_name} (+${insights.rivals.improving_vs.delta_points} pts)` : 'N/A'}
                        </p>
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2>Form & Momentum</h2>
                        <p>Rolling 10: {insights?.form.rolling_10_win_rate ?? 0}% WR</p>
                        <p>Rolling 20: {insights?.form.rolling_20_win_rate ?? 0}% WR</p>
                        <p>Momentum: {insights?.form.momentum ?? 'new'}</p>
                        <p>Recent: {(insights?.form.recent_results ?? []).slice(0, 10).join(' ') || '-'}</p>
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2><IonIcon icon={flameOutline} /> Current Season</h2>
                        {affiliationsLoading ? (
                            <div><IonSpinner name="crescent" /></div>
                        ) : affiliations.length === 0 ? (
                            <p>No active-season affiliations found.</p>
                        ) : (
                            <IonList lines="none">
                                {affiliations.map((affiliation) => (
                                    <IonItem key={`${affiliation.team_id}-${affiliation.competition_name}`} lines="none">
                                        <IonLabel>
                                            <h3>{affiliation.team_name}</h3>
                                            <p>{affiliation.league_name} · {affiliation.competition_name}</p>
                                            <p>{affiliation.season_name}</p>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        )}
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2><IonIcon icon={calendarOutline} /> Match History</h2>
                        {rubbersLoading && rubbers.length === 0 ? (
                            <div><IonSpinner name="crescent" /></div>
                        ) : rubbers.length === 0 ? (
                            <p>No recent matches found.</p>
                        ) : (
                            <IonList lines="none">
                                {rubbers.map((rubber) => (
                                    <IonItem key={rubber.id} lines="none">
                                        <IonLabel>
                                            <h3>vs {rubber.opponent}</h3>
                                            <p>{rubber.date} · {rubber.league}</p>
                                            <p>{rubber.result.replace('Won ', '').replace('Lost ', '')}</p>
                                        </IonLabel>
                                        <IonButton size="small" fill="outline" onClick={() => navigate(`/fixtures/${rubber.fixture_id}`)}>
                                            Fixture
                                        </IonButton>
                                        {rubber.opponent_id && (
                                            <IonButton size="small" onClick={() => openH2H(rubber.opponent_id!, rubber.opponent)}>
                                                H2H
                                            </IonButton>
                                        )}
                                    </IonItem>
                                ))}
                            </IonList>
                        )}

                        {hasMoreRubbers && (
                            <IonButton
                                expand="block"
                                fill="outline"
                                disabled={rubbersFetching}
                                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                            >
                                {rubbersFetching ? 'Loading...' : 'Load more matches'}
                            </IonButton>
                        )}
                    </IonCardContent>
                </IonCard>
            </main>
        </div>
    );
}
