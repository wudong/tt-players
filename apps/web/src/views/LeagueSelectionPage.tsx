import { ArrowLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildRegionBuckets, leagueRegionLabels } from '../config/leagueRegions';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';

interface LeagueSelectionLocationState {
    returnTo?: string;
}

export function LeagueSelectionPage() {
    const navigate = useNavigate();
    const location = useLocation();
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

    const goBack = () => {
        const state = location.state as LeagueSelectionLocationState | null;
        if (state?.returnTo) {
            navigate(state.returnTo);
            return;
        }
        navigate(-1);
    };

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
        <div className="flex min-h-screen flex-col bg-slate-50 pb-28">
            <header className="rounded-b-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 px-6 pb-8 pt-14 shadow-lg">
                <button
                    onClick={goBack}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100 transition hover:text-white"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                <h1 className="text-2xl font-extrabold text-white">Choose Leagues</h1>
                <p className="mt-1 text-sm text-emerald-100/90">
                    Search leagues or use regions to select multiple leagues quickly.
                </p>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2 ring-1 ring-white/40">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search leagues or regions..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                </div>
            </header>

            <main className="flex-1 px-5 pt-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                        onClick={selectAllLeagues}
                        className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                    >
                        Select all
                    </button>
                    <button
                        onClick={clearSelectedLeagues}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                        Clear all
                    </button>
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                        {selectedLeagueIds.length} selected
                    </span>
                </div>

                <section className="mb-5">
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Regions</h2>
                    <div className="flex flex-wrap gap-2">
                        {regionBuckets.map((bucket) => {
                            const allSelected = bucket.leagueIds.every((id) => selectedLeagueIds.includes(id));
                            return (
                                <button
                                    key={bucket.id}
                                    onClick={() => toggleRegion(bucket.leagueIds)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                        allSelected
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-white text-slate-600 ring-1 ring-slate-200'
                                    }`}
                                >
                                    {bucket.label} ({bucket.leagueIds.length})
                                </button>
                            );
                        })}
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : filteredLeagues.length === 0 ? (
                    <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-100">
                        No leagues matched your search.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredLeagues.map((league) => {
                            const isSelected = selectedLeagueIds.includes(league.id);
                            const regionLabels = leagueRegionLabels(league.name);
                            return (
                                <button
                                    key={league.id}
                                    onClick={() => toggleLeague(league.id)}
                                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                                        isSelected
                                            ? 'bg-emerald-50 ring-1 ring-emerald-300'
                                            : 'bg-white ring-1 ring-slate-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{league.name}</p>
                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                {league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {regionLabels.map((label) => (
                                                    <span
                                                        key={`${league.id}-${label}`}
                                                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-bold ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
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
