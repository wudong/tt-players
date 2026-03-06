import { IonButton, IonCard, IonCardContent, IonChip, IonIcon, IonItem, IonLabel, IonList, IonSpinner } from '@ionic/react';
import { pulseOutline, listOutline, trophyOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeagueFilterButton } from '../components/LeagueFilterButton';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { useLeaders } from '../hooks/useLeaders';
import { useLeagueSeasons } from '../hooks/useLeagueSeasons';
import { useLeagues } from '../hooks/useLeagues';
import type { LeaderboardMode, LeagueWithDivisions } from '../types';
import { LeagueTable } from './LeagueTable';

export function LeaguesHubView() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'tables' | 'leaders'>('tables');

    const { selectedLeagueIds, isLoading: preferencesLoading } = useLeaguePreferences();
    const { data: seasonOptionsData, isLoading: seasonOptionsLoading } = useLeagueSeasons();
    const seasonOptions = seasonOptionsData?.data ?? [];
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

    const { data: leaguesData, isLoading: leaguesLoading } = useLeagues(selectedSeasonId ?? undefined);

    useEffect(() => {
        if (seasonOptions.length === 0) return;
        if (selectedSeasonId && seasonOptions.some((season) => season.id === selectedSeasonId)) return;
        const activeSeason = seasonOptions.find((season) => season.is_active);
        setSelectedSeasonId(activeSeason?.id ?? seasonOptions[0]!.id);
    }, [seasonOptions, selectedSeasonId]);

    const allSeasonLeagues = leaguesData?.data ?? [];
    const leagues = useMemo(
        () => allSeasonLeagues.filter((league) => selectedLeagueIds.includes(league.id)),
        [allSeasonLeagues, selectedLeagueIds],
    );

    const visibleLeagueIds = useMemo(() => leagues.map((league) => league.id), [leagues]);
    const isLoading = preferencesLoading || seasonOptionsLoading || leaguesLoading;

    const [selectedLeague, setSelectedLeague] = useState<LeagueWithDivisions | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [leadersMode, setLeadersMode] = useState<LeaderboardMode>('combined');

    const leadersLimit = leadersMode === 'win_pct' ? 10 : 20;
    const { data: leadersData, isLoading: leadersLoading } = useLeaders(
        leadersMode,
        visibleLeagueIds,
        leadersLimit,
        3,
        selectedSeasonId ?? undefined,
    );

    useEffect(() => {
        if (leagues.length === 0) {
            setSelectedLeague(null);
            setSelectedDivisionId(null);
            return;
        }

        const fallbackLeague = leagues[0];
        const nextLeague = selectedLeague && leagues.some((league) => league.id === selectedLeague.id)
            ? leagues.find((league) => league.id === selectedLeague.id) ?? fallbackLeague
            : fallbackLeague;

        if (!selectedLeague || selectedLeague.id !== nextLeague.id) {
            setSelectedLeague(nextLeague);
        }

        if (!selectedDivisionId || !nextLeague.divisions.some((division) => division.id === selectedDivisionId)) {
            setSelectedDivisionId(nextLeague.divisions[0]?.id ?? null);
        }
    }, [leagues, selectedLeague, selectedDivisionId]);

    return (
        <div>
            <header>
                <div>
                    <div>
                        <p>League Hub</p>
                        <h1>League Central</h1>
                    </div>
                    <LeagueFilterButton
                        count={selectedLeagueIds.length}
                        onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}
                    />
                </div>

                <div>
                    <label htmlFor="season-select">Season</label>
                    <select
                        id="season-select"
                        value={selectedSeasonId ?? ''}
                        onChange={(event) => setSelectedSeasonId(event.currentTarget.value)}
                    >
                        {seasonOptions.map((season) => (
                            <option key={season.id} value={season.id}>
                                {season.name}{season.is_active ? ' (Current)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div role="tablist" aria-label="League views">
                    <button
                        id="tables"
                        role="tab"
                        aria-selected={selectedTab === 'tables'}
                        onClick={() => setSelectedTab('tables')}
                    >
                        <IonIcon icon={listOutline} /> Tables
                    </button>
                    <button
                        id="leaders"
                        role="tab"
                        aria-selected={selectedTab === 'leaders'}
                        onClick={() => setSelectedTab('leaders')}
                    >
                        <IonIcon icon={pulseOutline} /> Leaders
                    </button>
                </div>
            </header>

            <main>
                {isLoading ? (
                    <div><IonSpinner name="crescent" /></div>
                ) : leagues.length === 0 ? (
                    <IonCard>
                        <IonCardContent>
                            <IonIcon icon={trophyOutline} />
                            <h3>No leagues selected</h3>
                            <p>Select leagues to show them in League Central.</p>
                            <IonButton onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}>
                                Choose leagues
                            </IonButton>
                        </IonCardContent>
                    </IonCard>
                ) : (
                    <>
                        {selectedTab === 'tables' && (
                            <>
                                <IonCard>
                                    <IonCardContent>
                                        <h3>League</h3>
                                        <div>
                                            {leagues.map((league) => (
                                                <IonChip
                                                    key={league.id}
                                                    outline={selectedLeague?.id !== league.id}
                                                    color={selectedLeague?.id === league.id ? 'primary' : undefined}
                                                   
                                                    onClick={() => {
                                                        setSelectedLeague(league);
                                                        setSelectedDivisionId(league.divisions[0]?.id ?? null);
                                                    }}
                                                >
                                                    {league.name}
                                                </IonChip>
                                            ))}
                                        </div>

                                        <h3>Division</h3>
                                        {!selectedLeague || selectedLeague.divisions.length === 0 ? (
                                            <p>Pick a league first.</p>
                                        ) : (
                                            <div>
                                                {selectedLeague.divisions.map((division) => (
                                                    <IonChip
                                                        key={division.id}
                                                        outline={selectedDivisionId !== division.id}
                                                        color={selectedDivisionId === division.id ? 'primary' : undefined}
                                                       
                                                        onClick={() => setSelectedDivisionId(division.id)}
                                                    >
                                                        {division.name}
                                                    </IonChip>
                                                ))}
                                            </div>
                                        )}
                                    </IonCardContent>
                                </IonCard>

                                <IonCard>
                                    <IonCardContent>
                                        {selectedDivisionId ? (
                                            <LeagueTable competitionId={selectedDivisionId} />
                                        ) : (
                                            <p>No division selected</p>
                                        )}
                                    </IonCardContent>
                                </IonCard>
                            </>
                        )}

                        {selectedTab === 'leaders' && (
                            <IonCard>
                                <IonCardContent>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setLeadersMode('win_pct')}
                                        >
                                            Best Win %
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeadersMode('most_played')}
                                        >
                                            Most Played
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeadersMode('combined')}
                                        >
                                            Combined
                                        </button>
                                    </div>

                                    {leadersLoading ? (
                                        <div><IonSpinner name="crescent" /></div>
                                    ) : !leadersData || leadersData.data.length === 0 ? (
                                        <p>No leaderboard data available for selected leagues.</p>
                                    ) : (
                                        <div>
                                            <p>{leadersData.formula}</p>
                                            <IonList lines="none">
                                                {leadersData.data.map((row) => (
                                                    <IonItem
                                                        key={row.player_id}
                                                        button
                                                        detail={false}
                                                        onClick={() => navigate(`/players/${row.player_id}`)}
                                                       
                                                    >
                                                        <IonLabel>
                                                            <h3>{row.rank}. {row.player_name}</h3>
                                                            <p>{row.wins}W-{row.losses}L · {row.played} played</p>
                                                        </IonLabel>
                                                        <div>
                                                            <strong>{Math.round(row.win_rate)}% WR</strong>
                                                            {row.score !== null && <small>Score {row.score.toFixed(2)}</small>}
                                                        </div>
                                                    </IonItem>
                                                ))}
                                            </IonList>
                                        </div>
                                    )}
                                </IonCardContent>
                            </IonCard>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
