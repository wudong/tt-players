import {
    IonButton,
    IonCard,
    IonCardContent,
    IonChip,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonSpinner,
} from '@ionic/react';
import { checkmarkOutline, closeOutline, gitCompareOutline, searchOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { usePlayerH2H } from '../hooks/usePlayerH2H';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { usePlayerStats } from '../hooks/usePlayerStats';
import type { PlayerSearchItem, RubberItem } from '../types';

interface H2HPrefillState {
    playerA?: PlayerSearchItem;
    playerB?: PlayerSearchItem;
}

function overallWinRate(player: PlayerSearchItem, total?: number, wins?: number) {
    if (typeof total === 'number' && total > 0 && typeof wins === 'number') {
        return Math.round((wins / total) * 100);
    }
    return player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0;
}

interface PickerProps {
    label: string;
    selected: PlayerSearchItem | null;
    onSelect: (player: PlayerSearchItem | null) => void;
    excludeId?: string;
    leagueIds: string[];
}

function PlayerPicker({ label, selected, onSelect, excludeId, leagueIds }: PickerProps) {
    const [query, setQuery] = useState('');
    const normalizedQuery = query.trim();
    const shouldSearch = normalizedQuery.length > 2;

    const { data, isLoading } = usePlayerSearch(query, leagueIds, { enabled: shouldSearch });

    const results = useMemo(
        () => (data?.data ?? []).filter((player) => player.id !== excludeId),
        [data?.data, excludeId],
    );

    if (selected) {
        return (
            <IonItem lines="none">
                <IonLabel>
                    <h3>{label}</h3>
                    <p>{selected.name}</p>
                </IonLabel>
                <IonButton fill="clear" color="medium" onClick={() => onSelect(null)}>
                    <IonIcon icon={closeOutline} />
                </IonButton>
            </IonItem>
        );
    }

    return (
        <div>
            <IonSearchbar
                value={query}
                onIonInput={(e) => setQuery(e.detail.value ?? '')}
                placeholder={`Search ${label}...`}
               
                showClearButton="focus"
            />
            {shouldSearch && (
                <IonList lines="none">
                    {isLoading && (
                        <div><IonSpinner name="crescent" /></div>
                    )}
                    {!isLoading && results.map((player) => (
                        <IonItem
                            key={player.id}
                            button
                            detail={false}
                           
                            onClick={() => {
                                onSelect(player);
                                setQuery('');
                            }}
                        >
                            <IonLabel>
                                <h3>{player.name}</h3>
                                <p>{player.wins}W · {player.played} played</p>
                            </IonLabel>
                            <IonIcon icon={searchOutline} />
                        </IonItem>
                    ))}
                    {!isLoading && results.length === 0 && (
                        <IonItem lines="none">
                            <IonLabel>No players found</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            )}
        </div>
    );
}

export function H2HView() {
    const [playerA, setPlayerA] = useState<PlayerSearchItem | null>(null);
    const [playerB, setPlayerB] = useState<PlayerSearchItem | null>(null);
    const location = useLocation();
    const { selectedLeagueIds } = useLeaguePreferences();

    useEffect(() => {
        const prefill = location.state as H2HPrefillState | null;
        if (prefill?.playerA && prefill?.playerB) {
            setPlayerA(prefill.playerA);
            setPlayerB(prefill.playerB);
        }
    }, [location.state]);

    const { data: h2hData, isLoading: h2hLoading } = usePlayerH2H(playerA?.id, playerB?.id);
    const { data: playerAStats } = usePlayerStats(playerA?.id ?? '');
    const { data: playerBStats } = usePlayerStats(playerB?.id ?? '');
    const h2h = h2hData;
    const h2hTotal = h2h ? h2h.player1_wins + h2h.player2_wins : 0;

    return (
        <div>
            <header>
                <p>Compare</p>
                <h1><IonIcon icon={gitCompareOutline} /> Head to Head</h1>
                <p>Compare players and past encounters.</p>
            </header>

            <main>
                <IonCard>
                    <IonCardContent>
                        <h2>Players</h2>
                        <PlayerPicker
                            label="Player A"
                            selected={playerA}
                            onSelect={setPlayerA}
                            excludeId={playerB?.id}
                            leagueIds={selectedLeagueIds}
                        />
                        <PlayerPicker
                            label="Player B"
                            selected={playerB}
                            onSelect={setPlayerB}
                            excludeId={playerA?.id}
                            leagueIds={selectedLeagueIds}
                        />
                    </IonCardContent>
                </IonCard>

                {!playerA || !playerB ? (
                    <IonCard><IonCardContent><p>Select both players to see win split and encounter history.</p></IonCardContent></IonCard>
                ) : null}

                {h2hLoading && playerA && playerB && (
                    <div><IonSpinner name="crescent" /></div>
                )}

                {h2h && playerA && playerB && (
                    <>
                        <IonCard>
                            <IonCardContent>
                                <h2>Matchups ({h2hTotal})</h2>
                                <div>
                                    <div>
                                        <strong>{h2h.player1_wins}</strong>
                                        <span>{playerA.name}</span>
                                    </div>
                                    <div>
                                        <strong>{h2h.player2_wins}</strong>
                                        <span>{playerB.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ width: `${h2hTotal ? (h2h.player1_wins / h2hTotal) * 100 : 0}%` }} />
                                    <div style={{ width: `${h2hTotal ? (h2h.player2_wins / h2hTotal) * 100 : 0}%` }} />
                                </div>
                                <div>
                                    <IonChip>{overallWinRate(playerA, playerAStats?.total, playerAStats?.wins)}% WR</IonChip>
                                    <IonChip>{overallWinRate(playerB, playerBStats?.total, playerBStats?.wins)}% WR</IonChip>
                                </div>
                            </IonCardContent>
                        </IonCard>

                        <IonCard>
                            <IonCardContent>
                                <h2>Past Encounters</h2>
                                {h2h.encounters.length === 0 ? (
                                    <p>No past encounters found.</p>
                                ) : (
                                    <IonList lines="none">
                                        {h2h.encounters.map((encounter: RubberItem) => {
                                            const winnerA = encounter.isWin;
                                            return (
                                                <IonItem key={encounter.id} lines="none">
                                                    <IonLabel>
                                                        <h3>{encounter.league}</h3>
                                                        <p>{encounter.date} · {encounter.result.replace('Won ', '').replace('Lost ', '')}</p>
                                                        <p>
                                                            {winnerA ? <IonIcon icon={checkmarkOutline} /> : null} {playerA.name.split(' ')[0]} vs {playerB.name.split(' ')[0]}
                                                        </p>
                                                    </IonLabel>
                                                </IonItem>
                                            );
                                        })}
                                    </IonList>
                                )}
                            </IonCardContent>
                        </IonCard>
                    </>
                )}
            </main>
        </div>
    );
}
