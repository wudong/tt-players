import { Swords, Search, X, Check } from 'lucide-react';
import { useState } from 'react';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { usePlayerH2H } from '../hooks/usePlayerH2H';
import { PlayerSearchItem, RubberItem } from '../types';

export function H2HView() {
    const [playerA, setPlayerA] = useState<PlayerSearchItem | null>(null);
    const [playerB, setPlayerB] = useState<PlayerSearchItem | null>(null);

    const { data: h2hData, isLoading: h2hLoading } = usePlayerH2H(playerA?.id, playerB?.id);
    const h2h = h2hData;
    const h2hTotal = h2h ? h2h.player1_wins + h2h.player2_wins : 0;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300 pb-28 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="rounded-b-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-black px-6 pb-8 pt-16 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10 flex items-center gap-3 drop-shadow-md">
                    <Swords className="text-indigo-400 drop-shadow-sm" size={28} /> Head to Head
                </h1>
                <p className="relative z-10 text-slate-300">Compare players and past encounters</p>
            </div>

            <div className="px-5 flex flex-col gap-6 mt-2">
                {/* Player Selectors */}
                <section className="flex flex-col gap-0 relative">
                    <div className="absolute left-[24px] top-[40px] bottom-[40px] w-0.5 bg-slate-200 z-0"></div>

                    <PlayerAutocomplete
                        label="Player A"
                        selected={playerA}
                        onSelect={setPlayerA}
                        excludeId={playerB?.id}
                        color="indigo"
                    />

                    <div className="relative z-10 my-1 ml-[11px] flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-50 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400">VS</span>
                    </div>

                    <PlayerAutocomplete
                        label="Player B"
                        selected={playerB}
                        onSelect={setPlayerB}
                        excludeId={playerA?.id}
                        color="pink"
                    />
                </section>

                {/* Loading State */}
                {h2hLoading && playerA && playerB && (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                    </div>
                )}

                {/* Results Section */}
                {h2h && playerA && playerB && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {/* Comparison Stats */}
                        <section className="bg-white rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-100 mt-2">
                            <h3 className="text-center text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Matchups ({h2hTotal})</h3>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-3xl font-black text-indigo-600">{h2h.player1_wins}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Wins</span>
                                <span className="text-3xl font-black text-pink-500">{h2h.player2_wins}</span>
                            </div>

                            {/* Comparison Bar */}
                            <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 shadow-inner">
                                {h2hTotal > 0 ? (
                                    <>
                                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-1000" style={{ width: `${(h2h.player1_wins / h2hTotal) * 100}%` }}></div>
                                        <div className="bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-1000" style={{ width: `${(h2h.player2_wins / h2hTotal) * 100}%` }}></div>
                                    </>
                                ) : (
                                    <div className="w-full bg-slate-200"></div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-800">{playerA.played > 0 ? Math.round((playerA.wins / playerA.played) * 100) : 0}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Overall WR</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-800">{playerB.played > 0 ? Math.round((playerB.wins / playerB.played) * 100) : 0}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Overall WR</span>
                                </div>
                            </div>
                        </section>

                        {/* Past Encounters */}
                        <section className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800">Past Encounters</h3>
                            </div>

                            {h2h.encounters.length === 0 ? (
                                <div className="text-center p-6 text-sm text-slate-500 bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm">
                                    No past encounters found.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {h2h.encounters.map((encounter: RubberItem) => {
                                        // winner logic based on isWin (which corresponds to whether playerA won if they are player1)
                                        // Wait, the API returns isWin from the perspective of the player whose ID is passed first.
                                        // But the RubberItem has `opponent`, `league`, `date`, `result` representing playerA's perspective.
                                        const winnerId = encounter.isWin ? playerA.id : playerB.id;
                                        return (
                                            <div key={encounter.id} className="flex flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{encounter.date}</span>
                                                    <span className="text-[11px] font-semibold text-slate-400 max-w-[160px] truncate">{encounter.league}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className={`font-bold ${winnerId === playerA.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                        {winnerId === playerA.id && <Check size={14} className="inline mr-1 text-indigo-500" />}
                                                        {playerA.name.split(' ')[0]}
                                                    </div>
                                                    <div className="px-3 py-1 bg-slate-50 rounded-xl text-xs font-black tracking-widest text-slate-500 border border-slate-100">
                                                        {encounter.result.replace('Won ', '').replace('Lost ', '')}
                                                    </div>
                                                    <div className={`font-bold ${winnerId === playerB.id ? 'text-pink-500' : 'text-slate-700'}`}>
                                                        {playerB.name.split(' ')[0]}
                                                        {winnerId === playerB.id && <Check size={14} className="inline ml-1 text-pink-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Child component: PlayerAutocomplete
// ─────────────────────────────────────────────────────────────────────────────

interface AutocompleteProps {
    label: string;
    selected: PlayerSearchItem | null;
    onSelect: (p: PlayerSearchItem | null) => void;
    excludeId?: string;
    color: 'indigo' | 'pink';
}

function PlayerAutocomplete({ label, selected, onSelect, excludeId, color }: AutocompleteProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const { data } = usePlayerSearch(query);
    const results = (data?.data || []).filter(p => p.id !== excludeId);

    const colorClasses = color === 'indigo'
        ? 'ring-indigo-100 text-indigo-600 bg-indigo-50/50 focus:ring-indigo-500'
        : 'ring-pink-100 text-pink-600 bg-pink-50/50 focus:ring-pink-500';

    if (selected) {
        return (
            <div className="relative z-10 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold bg-${color}-100 text-${color}-600`}>
                        {selected.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
                        <div className="font-bold text-slate-800">{selected.name}</div>
                    </div>
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${isFocused ? 'z-30' : 'z-20'}`}>
            <div className={`flex items-center gap-3 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-slate-200 transition-all ${isFocused ? 'ring-2 ' + colorClasses : ''}`}>
                <Search size={18} className={isFocused ? `text-${color}-500` : "text-slate-400"} />
                <input
                    type="text"
                    placeholder={`Search ${label}...`}
                    className="h-14 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
            </div>

            {/* Dropdown */}
            {isFocused && query.length > 2 && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-100 z-50 max-h-60 overflow-y-auto">
                    {results.map(player => (
                        <button
                            key={player.id}
                            onClick={() => {
                                onSelect(player);
                                setQuery('');
                            }}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">
                                {player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">{player.name}</div>
                                <div className="text-xs font-semibold text-slate-400">{player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0}% WR • {player.played} matches</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
