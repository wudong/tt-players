import { Search } from 'lucide-react';
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
            if (allSelected) {
                return previous.filter((id) => !leagueIds.includes(id));
            }
            return [...previous, ...leagueIds];
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-transparent pb-28">
            <header className="tt-hero tt-hero-league-pick">
                <div className="relative z-10">
                    <h1 className="tt-hero-title">Choose Leagues</h1>
                    <p className="tt-hero-subtitle mt-2">
                        Search leagues or use regions to apply quick multi-select.
                    </p>
                    <div className="tt-search-shell mt-4">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search leagues or regions..."
                            className="tt-input"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 px-5 pt-6">
                <div className="tt-card mb-4 flex flex-wrap items-center gap-2 p-3">
                    <button onClick={selectAllLeagues} className="tt-chip-active">Select all</button>
                    <button onClick={clearSelectedLeagues} className="tt-chip">Clear all</button>
                    <span className="ml-auto tt-meta font-extrabold tracking-wide">
                        {selectedLeagueIds.length} selected
                    </span>
                </div>

                <section className="tt-card mb-4 p-4">
                    <h2 className="tt-section-title mb-2">Regions</h2>
                    <div className="flex flex-wrap gap-2">
                        {regionBuckets.map((bucket) => {
                            const allSelected = bucket.leagueIds.every((id) => selectedLeagueIds.includes(id));
                            return (
                                <button
                                    key={bucket.id}
                                    onClick={() => toggleRegion(bucket.leagueIds)}
                                    className={allSelected ? 'tt-chip-active' : 'tt-chip'}
                                >
                                    {bucket.label} ({bucket.leagueIds.length})
                                </button>
                            );
                        })}
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                    </div>
                ) : filteredLeagues.length === 0 ? (
                    <div className="tt-card p-6 tt-body-sm text-slate-500">
                        No leagues matched your search.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredLeagues.map((league) => {
                            const isSelected = selectedLeagueIds.includes(league.id);
                            const regionLabels = leagueRegionLabels(league.name);
                            return (
                                <button
                                    key={league.id}
                                    onClick={() => toggleLeague(league.id)}
                                    className={`tt-card w-full px-4 py-3 text-left ${
                                        isSelected ? 'border-[#b9cdff] bg-[#edf3ff]' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="tt-title-md !text-sm">{league.name}</p>
                                            <p className="tt-meta mt-1">
                                                {league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {regionLabels.map((label) => (
                                                    <span key={`${league.id}-${label}`} className="tt-chip !px-2 !py-0.5 !text-[10px]">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-black ${
                                                isSelected
                                                    ? 'border-[#2869fe] bg-[#2869fe] text-white'
                                                    : 'border-slate-300 text-slate-300'
                                            }`}
                                        >
                                            ✓
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
