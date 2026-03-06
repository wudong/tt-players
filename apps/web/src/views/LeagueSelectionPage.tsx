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
        <div>
            <header>
                <p>Preferences</p>
                <h1>Choose Leagues</h1>
                <p>Search leagues or use regions to apply quick multi-select.</p>
                <IonSearchbar
                    value={query}
                    onIonInput={(e) => setQuery(e.detail.value ?? '')}
                    placeholder="Search leagues or regions..."
                   
                    showClearButton="focus"
                />
            </header>

            <main>
                <IonCard>
                    <IonCardContent>
                        <div>
                            <IonButton size="small" onClick={selectAllLeagues}>Select all</IonButton>
                            <IonButton size="small" fill="outline" onClick={clearSelectedLeagues}>Clear all</IonButton>
                            <IonBadge>{selectedLeagueIds.length} selected</IonBadge>
                        </div>
                    </IonCardContent>
                </IonCard>

                <IonCard>
                    <IonCardContent>
                        <h2>Regions</h2>
                        <div>
                            {regionBuckets.map((bucket) => {
                                const allSelected = bucket.leagueIds.every((id) => selectedLeagueIds.includes(id));
                                return (
                                    <IonChip
                                        key={bucket.id}
                                        color={allSelected ? 'primary' : undefined}
                                        outline={!allSelected}
                                       
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
                    <div><IonSpinner name="crescent" /></div>
                ) : filteredLeagues.length === 0 ? (
                    <IonCard><IonCardContent><p>No leagues matched your search.</p></IonCardContent></IonCard>
                ) : (
                    <IonList lines="none">
                        {filteredLeagues.map((league) => {
                            const isSelected = selectedLeagueIds.includes(league.id);
                            const regionLabels = leagueRegionLabels(league.name);
                            return (
                                <IonItem
                                    key={league.id}
                                    button
                                    detail={false}
                                    onClick={() => toggleLeague(league.id)}
                                >
                                    <IonLabel>
                                        <h3>{league.name}</h3>
                                        <p>{league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}</p>
                                        <div>
                                            {regionLabels.map((label) => (
                                                <IonChip key={`${league.id}-${label}`} outline>{label}</IonChip>
                                            ))}
                                        </div>
                                    </IonLabel>
                                    <IonIcon icon={isSelected ? checkmarkCircle : ellipseOutline} color={isSelected ? 'success' : 'medium'} />
                                </IonItem>
                            );
                        })}
                    </IonList>
                )}
            </main>
        </div>
    );
}
