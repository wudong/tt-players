import { Swords, Search, X, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    ComboBox,
    Input,
    ListBox,
    ListBoxItem,
    Popover,
} from 'react-aria-components';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { usePlayerH2H } from '../hooks/usePlayerH2H';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { PlayerSearchItem, RubberItem } from '../types';
import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { PressButton } from '../ui/PressButton';

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
        <div className="flex min-h-screen flex-col gap-6 bg-transparent pb-28">
            <header className="tt-hero tt-hero-h2h">
                <div className="relative z-10">
                    <h1 className="tt-hero-title mb-2 flex items-center gap-3 !text-[2.05rem]">
                        <Swords className="text-blue-100" size={24} /> Head to Head
                    </h1>
                    <p className="tt-hero-subtitle">Compare players and past encounters.</p>
                </div>
            </header>

            <div className="px-5">
                <section className="tt-card p-4">
                    <h2 className="tt-section-title">Players</h2>
                    <div className="flex flex-col gap-3">
                        <PlayerAutocomplete
                            label="Player A"
                            selected={playerA}
                            onSelect={setPlayerA}
                            excludeId={playerB?.id}
                            leagueIds={selectedLeagueIds}
                            tone="primary"
                        />
                        <PlayerAutocomplete
                            label="Player B"
                            selected={playerB}
                            onSelect={setPlayerB}
                            excludeId={playerA?.id}
                            leagueIds={selectedLeagueIds}
                            tone="violet"
                        />
                    </div>
                </section>

                {!playerA || !playerB ? (
                    <section className="tt-card mt-4 p-4 tt-body-sm">
                        Select both players to see win split and encounter history.
                    </section>
                ) : null}

                {h2hLoading && playerA && playerB && (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2869fe]"></div>
                    </div>
                )}

                {h2h && playerA && playerB && (
                    <div className="mt-4 flex flex-col gap-4">
                        <section className="tt-card p-5">
                            <h3 className="tt-kicker text-center text-slate-500">Matchups ({h2hTotal})</h3>
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-3xl tt-num text-[#2869fe]">{h2h.player1_wins}</p>
                                <p className="tt-kicker text-slate-400">Wins</p>
                                <p className="text-3xl tt-num text-[#7c66ff]">{h2h.player2_wins}</p>
                            </div>
                            <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-[#edf2ff] ring-1 ring-[#dbe4fa]">
                                {h2hTotal > 0 ? (
                                    <>
                                        <div
                                            className="bg-[#2869fe] transition-all duration-1000"
                                            style={{ width: `${(h2h.player1_wins / h2hTotal) * 100}%` }}
                                        ></div>
                                        <div
                                            className="bg-[#7c66ff] transition-all duration-1000"
                                            style={{ width: `${(h2h.player2_wins / h2hTotal) * 100}%` }}
                                        ></div>
                                    </>
                                ) : (
                                    <div className="w-full bg-slate-200"></div>
                                )}
                            </div>
                            <div className="mt-5 flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-2xl tt-num text-slate-800">
                                        {overallWinRate(playerA, playerAStats?.total, playerAStats?.wins)}%
                                    </p>
                                    <p className="tt-kicker text-slate-400">Overall WR</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl tt-num text-slate-800">
                                        {overallWinRate(playerB, playerBStats?.total, playerBStats?.wins)}%
                                    </p>
                                    <p className="tt-kicker text-slate-400">Overall WR</p>
                                </div>
                            </div>
                        </section>

                        <section className="tt-card p-4">
                            <h3 className="tt-section-title mb-3">Past Encounters</h3>
                            {h2h.encounters.length === 0 ? (
                                <div className="rounded-xl bg-[#f5f8ff] p-5 text-center tt-body-sm text-slate-500">
                                    No past encounters found.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {h2h.encounters.map((encounter: RubberItem) => {
                                        const winnerId = encounter.isWin ? playerA.id : playerB.id;
                                        return (
                                            <div key={encounter.id} className="rounded-xl bg-[#f5f8ff] p-3 ring-1 ring-[#e7ecfa]">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="tt-kicker text-slate-400">
                                                        {encounter.date}
                                                    </span>
                                                    <span className="truncate tt-caption text-slate-500">{encounter.league}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className={`tt-title-md !text-sm ${winnerId === playerA.id ? 'text-[#2869fe]' : 'text-slate-700'}`}>
                                                        {winnerId === playerA.id && <Check size={14} className="mr-1 inline text-[#2869fe]" />}
                                                        {playerA.name.split(' ')[0]}
                                                    </div>
                                                    <div className="rounded-lg bg-white px-3 py-1 tt-num !text-xs text-slate-600 ring-1 ring-[#dbe4fa]">
                                                        {encounter.result.replace('Won ', '').replace('Lost ', '')}
                                                    </div>
                                                    <div className={`tt-title-md !text-sm ${winnerId === playerB.id ? 'text-[#7c66ff]' : 'text-slate-700'}`}>
                                                        {playerB.name.split(' ')[0]}
                                                        {winnerId === playerB.id && <Check size={14} className="ml-1 inline text-[#7c66ff]" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
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

interface AutocompleteProps {
    label: string;
    selected: PlayerSearchItem | null;
    onSelect: (p: PlayerSearchItem | null) => void;
    excludeId?: string;
    leagueIds: string[];
    tone: 'primary' | 'violet';
}

function toneClasses(tone: AutocompleteProps['tone']) {
    if (tone === 'primary') {
        return {
            avatar: 'bg-[#edf3ff] text-[#2869fe]',
            focus: 'focus-within:ring-[#2869fe]',
            icon: 'text-[#2869fe]',
        };
    }
    return {
        avatar: 'bg-[#efeaff] text-[#7c66ff]',
        focus: 'focus-within:ring-[#7c66ff]',
        icon: 'text-[#7c66ff]',
    };
}

function PlayerAutocomplete({ label, selected, onSelect, excludeId, leagueIds, tone }: AutocompleteProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const normalizedQuery = query.trim();
    const shouldSearch = normalizedQuery.length > 2;
    const { data } = usePlayerSearch(query, leagueIds, {
        enabled: shouldSearch,
    });
    const results = useMemo(
        () => (data?.data || []).filter((player) => player.id !== excludeId),
        [data?.data, excludeId],
    );
    const playersById = useMemo(
        () => new Map(results.map((player) => [player.id, player])),
        [results],
    );
    const toneStyle = toneClasses(tone);

    if (selected) {
        return (
            <div className="flex items-center justify-between rounded-xl bg-[#f5f8ff] p-3 ring-1 ring-[#e7ecfa]">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold ${toneStyle.avatar}`}>
                        {selected.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="tt-kicker text-slate-400">{label}</p>
                        <p className="tt-title-md !text-sm">{selected.name}</p>
                    </div>
                </div>
                <PressButton
                    onPress={() => onSelect(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-[#dbe4fa]"
                >
                    <X size={15} />
                </PressButton>
            </div>
        );
    }

    return (
        <ComboBox
            aria-label={label}
            items={shouldSearch ? results : []}
            menuTrigger="input"
            inputValue={query}
            onInputChange={setQuery}
            onSelectionChange={(key) => {
                if (key == null) return;
                const chosen = playersById.get(String(key));
                if (!chosen) return;
                onSelect(chosen);
                setQuery('');
            }}
            className={`relative ${isFocused ? 'z-20' : ''}`}
        >
            <div className={`flex items-center gap-3 rounded-xl bg-[#f5f8ff] px-3 ring-1 ring-[#dbe4fa] ${toneStyle.focus}`}>
                <Search size={17} className={isFocused ? toneStyle.icon : 'text-slate-400'} />
                <Input
                    placeholder={`Search ${label}...`}
                    className="tt-input h-12"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
            </div>

            <Popover
                offset={8}
                className="z-50 max-h-60 w-[var(--trigger-width)] overflow-y-auto rounded-xl bg-white p-2 shadow-xl ring-1 ring-[#dbe4fa]"
            >
                <ListBox<PlayerSearchItem> className="flex flex-col gap-1">
                    {(player: PlayerSearchItem) => (
                        <ListBoxItem
                            id={player.id}
                            textValue={player.name}
                            className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition data-[focused]:bg-[#f5f8ff] data-[hovered]:bg-[#f5f8ff]"
                        >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-extrabold ${toneStyle.avatar}`}>
                                {player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="tt-title-md !text-sm">{player.name}</p>
                                <p className="tt-meta">
                                    {player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0}% WR • {player.played} matches
                                </p>
                            </div>
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </ComboBox>
    );
}
