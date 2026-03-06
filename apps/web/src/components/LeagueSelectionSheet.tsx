import { useLeaguePreferences } from '../context/LeaguePreferencesContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function LeagueSelectionSheet({ isOpen, onClose, title = 'Select Leagues' }: Props) {
    const {
        allLeagues,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
    } = useLeaguePreferences();

    if (!isOpen) return null;

    return (
        <div>
            <div role="dialog" aria-label={title}>
                <div>
                    <h3>{title}</h3>
                    <button type="button" onClick={onClose}>Done</button>
                </div>

                <div>
                    <button type="button" onClick={selectAllLeagues}>Select all</button>
                    <button type="button" onClick={clearSelectedLeagues}>Clear all</button>
                </div>

                <div role="list">
                    {allLeagues.map((league) => {
                        return (
                            <button
                                key={league.id}
                                type="button"
                                onClick={() => toggleLeague(league.id)}
                            >
                                <div>{league.name}</div>
                                <div>
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
