import {
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonSpinner,
    IonText,
} from '@ionic/react';
import { chevronForwardOutline, searchOutline, starOutline, trendingUpOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeagueFilterButton } from '../components/LeagueFilterButton';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { useFavouritePlayers } from '../hooks/useFavouritePlayers';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import type { PlayerSearchItem } from '../types';

function getInitials(name: string) {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function PlayerRow({
    player,
    onClick,
}: {
    player: PlayerSearchItem & { played?: number; wins?: number };
    onClick: () => void;
}) {
    const played = player.played ?? 0;
    const wins = player.wins ?? 0;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return (
        <IonItem button detail={false} onClick={onClick} className="tt-list-item">
            <div className="tt-avatar">{getInitials(player.name)}</div>
            <IonLabel>
                <h3>{player.name}</h3>
                <p>{winRate}% WR · {played} matches</p>
            </IonLabel>
            <IonButton fill="outline" size="small" className="tt-inline-btn">Open</IonButton>
            <IonIcon icon={chevronForwardOutline} className="tt-item-arrow" />
        </IonItem>
    );
}

export function HomeView() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { favouritePlayers } = useFavouritePlayers();
    const { selectedLeagueIds, isLoading: leaguePreferencesLoading } = useLeaguePreferences();

    const hasSelectedLeagues = selectedLeagueIds.length > 0;
    const { data: searchResults, isLoading } = usePlayerSearch(query, selectedLeagueIds, {
        enabled: hasSelectedLeagues,
    });

    const normalizedQuery = query.trim();
    const isSearchMode = normalizedQuery.length > 2;
    const showResultsSection = normalizedQuery.length === 0 || isSearchMode;

    return (
        <div className="tt-route-scroll">
            <header className="tt-hero tt-hero-home">
                <div className="tt-hero-row">
                    <div>
                        <p className="tt-eyebrow">Welcome Back</p>
                        <h1>TT Hub</h1>
                        <p className="tt-hero-sub">Find players, trends and league performance</p>
                    </div>
                    <LeagueFilterButton
                        count={selectedLeagueIds.length}
                        onClick={() => navigate('/leagues/select', { state: { returnTo: '/' } })}
                    />
                </div>
                <IonSearchbar
                    value={query}
                    onIonInput={(e) => setQuery(e.detail.value ?? '')}
                    placeholder="Search players..."
                    className="tt-search"
                    showClearButton="focus"
                />
            </header>

            <main className="tt-content">
                <IonCard className="tt-card">
                    <IonCardContent>
                        <div className="tt-card-head">
                            <h2><IonIcon icon={starOutline} /> Favourite Players</h2>
                            <IonText>{favouritePlayers.length} saved</IonText>
                        </div>

                        {favouritePlayers.length === 0 ? (
                            <p className="tt-hint">Open a player profile and tap Favourite to pin quick links here.</p>
                        ) : (
                            <IonList lines="none" className="tt-list">
                                {favouritePlayers.map((player) => (
                                    <PlayerRow
                                        key={player.id}
                                        player={player}
                                        onClick={() => navigate(`/players/${player.id}`)}
                                    />
                                ))}
                            </IonList>
                        )}
                    </IonCardContent>
                </IonCard>

                {showResultsSection && (
                    <IonCard className="tt-card">
                        <IonCardContent>
                            <div className="tt-card-head">
                                <h2>
                                    <IonIcon icon={isSearchMode ? searchOutline : trendingUpOutline} />
                                    {isSearchMode ? 'Search Results' : 'Trending Players'}
                                </h2>
                                <IonText>
                                    {selectedLeagueIds.length} league{selectedLeagueIds.length === 1 ? '' : 's'} selected
                                </IonText>
                            </div>

                            {normalizedQuery.length === 0 && (
                                <p className="tt-subtext">Most played in the last 100 days</p>
                            )}

                            {leaguePreferencesLoading || isLoading ? (
                                <div className="tt-center">
                                    <IonSpinner name="crescent" />
                                </div>
                            ) : !hasSelectedLeagues ? (
                                <p className="tt-hint">Select at least one league to view trending players.</p>
                            ) : (
                                <IonList lines="none" className="tt-list">
                                    {(searchResults?.data ?? []).map((player) => (
                                        <PlayerRow
                                            key={player.id}
                                            player={player}
                                            onClick={() => navigate(`/players/${player.id}`)}
                                        />
                                    ))}
                                    {(searchResults?.data?.length ?? 0) === 0 && (
                                        <IonItem className="tt-list-item tt-empty-item">
                                            <IonLabel>
                                                {isSearchMode
                                                    ? `No players found matching "${normalizedQuery}"`
                                                    : 'No trending players available yet.'}
                                            </IonLabel>
                                        </IonItem>
                                    )}
                                </IonList>
                            )}
                        </IonCardContent>
                    </IonCard>
                )}
            </main>
        </div>
    );
}
