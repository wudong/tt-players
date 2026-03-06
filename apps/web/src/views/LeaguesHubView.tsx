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
        <div className="tt-route-scroll">
            <header className="tt-hero tt-hero-leagues">
                <div className="tt-hero-row">
                    <div>
                        <p className="tt-eyebrow">League Hub</p>
                        <h1>League Central</h1>
                    </div>
                    <LeagueFilterButton
                        count={selectedLeagueIds.length}
                        onClick={() => navigate('/leagues/select', { state: { returnTo: '/leagues' } })}
                    />
                </div>

                <div className="tt-season-row">
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

                <div role="tablist" aria-label="League views" className="tt-tab-strip">
                    <button
                        id="tables"
                        role="tab"
                        aria-selected={selectedTab === 'tables'}
                        className={selectedTab === 'tables' ? 'tt-tab-btn active' : 'tt-tab-btn'}
                        onClick={() => setSelectedTab('tables')}
                    >
                        <IonIcon icon={listOutline} /> Tables
                    </button>
                    <button
                        id="leaders"
                        role="tab"
                        aria-selected={selectedTab === 'leaders'}
                        className={selectedTab === 'leaders' ? 'tt-tab-btn active' : 'tt-tab-btn'}
                        onClick={() => setSelectedTab('leaders')}
                    >
                        <IonIcon icon={pulseOutline} /> Leaders
                    </button>
                </div>
            </header>

            <main className="tt-content">
                {isLoading ? (
                    <div className="tt-state"><IonSpinner name="crescent" /></div>
                ) : leagues.length === 0 ? (
                    <IonCard className="tt-card">
                        <IonCardContent className="tt-card-center">
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
                                <IonCard className="tt-card">
                                    <IonCardContent>
                                        <h3 className="tt-section-subtitle">League</h3>
                                        <div className="tt-chip-row">
                                            {leagues.map((league) => (
                                                <IonChip
                                                    key={league.id}
                                                    outline={selectedLeague?.id !== league.id}
                                                    color={selectedLeague?.id === league.id ? 'primary' : undefined}
                                                    className="tt-chip"
                                                    onClick={() => {
                                                        setSelectedLeague(league);
                                                        setSelectedDivisionId(league.divisions[0]?.id ?? null);
                                                    }}
                                                >
                                                    {league.name}
                                                </IonChip>
                                            ))}
                                        </div>

                                        <h3 className="tt-section-subtitle">Division</h3>
                                        {!selectedLeague || selectedLeague.divisions.length === 0 ? (
                                            <p className="tt-hint">Pick a league first.</p>
                                        ) : (
                                            <div className="tt-chip-row">
                                                {selectedLeague.divisions.map((division) => (
                                                    <IonChip
                                                        key={division.id}
                                                        outline={selectedDivisionId !== division.id}
                                                        color={selectedDivisionId === division.id ? 'primary' : undefined}
                                                        className="tt-chip"
                                                        onClick={() => setSelectedDivisionId(division.id)}
                                                    >
                                                        {division.name}
                                                    </IonChip>
                                                ))}
                                            </div>
                                        )}
                                    </IonCardContent>
                                </IonCard>

                                <IonCard className="tt-card">
                                    <IonCardContent>
                                        {selectedDivisionId ? (
                                            <LeagueTable competitionId={selectedDivisionId} />
                                        ) : (
                                            <p className="tt-hint">No division selected</p>
                                        )}
                                    </IonCardContent>
                                </IonCard>
                            </>
                        )}

                        {selectedTab === 'leaders' && (
                            <IonCard className="tt-card">
                                <IonCardContent>
                                    <div className="tt-mode-row">
                                        <button
                                            type="button"
                                            className={leadersMode === 'win_pct' ? 'tt-native-btn' : 'tt-native-btn tt-native-btn-outline'}
                                            onClick={() => setLeadersMode('win_pct')}
                                        >
                                            Best Win %
                                        </button>
                                        <button
                                            type="button"
                                            className={leadersMode === 'most_played' ? 'tt-native-btn' : 'tt-native-btn tt-native-btn-outline'}
                                            onClick={() => setLeadersMode('most_played')}
                                        >
                                            Most Played
                                        </button>
                                        <button
                                            type="button"
                                            className={leadersMode === 'combined' ? 'tt-native-btn' : 'tt-native-btn tt-native-btn-outline'}
                                            onClick={() => setLeadersMode('combined')}
                                        >
                                            Combined
                                        </button>
                                    </div>

                                    {leadersLoading ? (
                                        <div className="tt-state"><IonSpinner name="crescent" /></div>
                                    ) : !leadersData || leadersData.data.length === 0 ? (
                                        <p className="tt-hint">No leaderboard data available for selected leagues.</p>
                                    ) : (
                                        <div>
                                            <p className="tt-subtext">{leadersData.formula}</p>
                                            <IonList lines="none" className="tt-list">
                                                {leadersData.data.map((row) => (
                                                    <IonItem
                                                        key={row.player_id}
                                                        button
                                                        detail={false}
                                                        onClick={() => navigate(`/players/${row.player_id}`)}
                                                        className="tt-list-item"
                                                    >
                                                        <IonLabel>
                                                            <h3>{row.rank}. {row.player_name}</h3>
                                                            <p>{row.wins}W-{row.losses}L · {row.played} played</p>
                                                        </IonLabel>
                                                        <div className="tt-right-meta">
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
