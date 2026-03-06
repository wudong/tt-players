import { useLeaguePreferences } from '../context/LeaguePreferencesContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function LeagueSelectionSheet({ isOpen, onClose, title = 'Select Leagues' }: Props) {
    const {
        allLeagues,
        selectedLeagueIds,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
    } = useLeaguePreferences();

    if (!isOpen) return null;

    return (
        <div className="tt-sheet-backdrop">
            <div role="dialog" aria-label={title} className="tt-sheet-content">
                <div className="tt-sheet-header">
                    <h3>{title}</h3>
                    <button type="button" className="tt-native-btn" onClick={onClose}>Done</button>
                </div>

                <div className="tt-sheet-actions">
                    <button type="button" className="tt-native-btn tt-native-btn-outline" onClick={selectAllLeagues}>Select all</button>
                    <button type="button" className="tt-native-btn tt-native-btn-outline" onClick={clearSelectedLeagues}>Clear all</button>
                </div>

                <div className="tt-sheet-list" role="list">
                    {allLeagues.map((league) => {
                        const isSelected = selectedLeagueIds.includes(league.id);
                        return (
                            <button
                                key={league.id}
                                type="button"
                                onClick={() => toggleLeague(league.id)}
                                className={isSelected ? 'tt-sheet-item tt-sheet-item-selected' : 'tt-sheet-item'}
                            >
                                <div className="tt-sheet-item-title">{league.name}</div>
                                <div className="tt-sheet-item-meta">
                                    {league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
