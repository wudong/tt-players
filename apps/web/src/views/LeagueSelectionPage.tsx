import { IonBadge, IonButton, IonCard, IonCardContent, IonChip, IonIcon, IonItem, IonLabel, IonList, IonSearchbar, IonSpinner } from '@ionic/react';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { buildRegionBuckets, leagueRegionLabels } from '../config/leagueRegions';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';

export function LeagueSelectionPage() {
    const [query, setQuery] = useState('');

    const {
        allLeagues,
        selectedLeagueIds,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
        updateSelectedLeagueIds,
        isLoading,
    } = useLeaguePreferences();

    const regionBuckets = useMemo(() => buildRegionBuckets(allLeagues), [allLeagues]);
    const normalizedQuery = query.trim().toLowerCase();

    const filteredLeagues = useMemo(() => {
        if (!normalizedQuery) return allLeagues;
        return allLeagues.filter((league) => {
            const inName = league.name.toLowerCase().includes(normalizedQuery);
            const inRegion = leagueRegionLabels(league.name)
                .some((label) => label.toLowerCase().includes(normalizedQuery));
            return inName || inRegion;
        });
    }, [allLeagues, normalizedQuery]);

    const toggleRegion = (leagueIds: string[]) => {
        const allSelected = leagueIds.every((id) => selectedLeagueIds.includes(id));
        updateSelectedLeagueIds((previous) => {
            if (allSelected) return previous.filter((id) => !leagueIds.includes(id));
            return [...previous, ...leagueIds];
        });
    };

    return (
        <div className="tt-route-scroll">
            <header className="tt-hero tt-hero-league-pick">
                <p className="tt-eyebrow">Preferences</p>
                <h1>Choose Leagues</h1>
                <p className="tt-hero-sub">Search leagues or use regions to apply quick multi-select.</p>
                <IonSearchbar
                    value={query}
                    onIonInput={(e) => setQuery(e.detail.value ?? '')}
                    placeholder="Search leagues or regions..."
                    className="tt-search"
                    showClearButton="focus"
                />
            </header>

            <main className="tt-content">
                <IonCard className="tt-card">
                    <IonCardContent>
                        <div className="tt-action-row">
                            <IonButton size="small" onClick={selectAllLeagues}>Select all</IonButton>
                            <IonButton size="small" fill="outline" onClick={clearSelectedLeagues}>Clear all</IonButton>
                            <IonBadge>{selectedLeagueIds.length} selected</IonBadge>
                        </div>
                    </IonCardContent>
                </IonCard>

                <IonCard className="tt-card">
                    <IonCardContent>
                        <h2 className="tt-section-subtitle">Regions</h2>
                        <div className="tt-chip-row">
                            {regionBuckets.map((bucket) => {
                                const allSelected = bucket.leagueIds.every((id) => selectedLeagueIds.includes(id));
                                return (
                                    <IonChip
                                        key={bucket.id}
                                        color={allSelected ? 'primary' : undefined}
                                        outline={!allSelected}
                                        className="tt-chip"
                                        onClick={() => toggleRegion(bucket.leagueIds)}
                                    >
                                        {bucket.label} ({bucket.leagueIds.length})
                                    </IonChip>
                                );
                            })}
                        </div>
                    </IonCardContent>
                </IonCard>

                {isLoading ? (
                    <div className="tt-state"><IonSpinner name="crescent" /></div>
                ) : filteredLeagues.length === 0 ? (
                    <IonCard className="tt-card"><IonCardContent><p className="tt-hint">No leagues matched your search.</p></IonCardContent></IonCard>
                ) : (
                    <IonList lines="none" className="tt-list">
                        {filteredLeagues.map((league) => {
                            const isSelected = selectedLeagueIds.includes(league.id);
                            const regionLabels = leagueRegionLabels(league.name);
                            return (
                                <IonItem
                                    key={league.id}
                                    button
                                    detail={false}
                                    className={isSelected ? 'tt-list-item tt-selected-item' : 'tt-list-item'}
                                    onClick={() => toggleLeague(league.id)}
                                >
                                    <IonLabel>
                                        <h3>{league.name}</h3>
                                        <p>{league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}</p>
                                        <div className="tt-region-badges">
                                            {regionLabels.map((label) => (
                                                <IonChip key={`${league.id}-${label}`} outline className="tt-mini-chip">{label}</IonChip>
                                            ))}
                                        </div>
                                    </IonLabel>
                                    <IonIcon icon={isSelected ? checkmarkCircle : ellipseOutline} className={isSelected ? 'tt-check-on' : 'tt-check-off'} />
                                </IonItem>
                            );
                        })}
                    </IonList>
                )}
            </main>
        </div>
    );
}
