import { Swords, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureRubbers } from '../hooks/useFixtureRubbers';

export function FixtureDetailsView() {
    const { fixtureId = '' } = useParams<{ fixtureId: string }>();
    const navigate = useNavigate();

    const { data: rubbersData, isLoading, isError } = useFixtureRubbers(fixtureId);
    const rubbers = rubbersData?.data || [];
    const fixtureMeta = rubbersData?.fixture;
    const playedAtLabel = fixtureMeta?.played_at
        ? new Date(fixtureMeta.played_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : 'Time not available';

    // Calculate overall score based on the rubbers
    let homeScore = 0;
    let awayScore = 0;

    rubbers.forEach(r => {
        if (r.home_games_won > r.away_games_won) homeScore++;
        else if (r.away_games_won > r.home_games_won) awayScore++;
        // ignore draws/walkovers in this simple tally if they are equal
    });

    return (
        <div className="flex flex-col pb-28 min-h-screen bg-slate-50">
            {/* Header */}
            <header className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 px-5 pb-8 pt-12 shadow-lg">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <button
                    onClick={() => navigate(-1)}
                    className="relative z-10 mb-6 flex items-center gap-1.5 text-sm font-semibold text-indigo-100 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="mb-2 rounded-full bg-indigo-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-100 backdrop-blur-sm border border-indigo-400/20">
                        Match Details
                    </span>
                    <h1 className="text-2xl font-extrabold text-white drop-shadow-md">
                        Fixture Results
                    </h1>
                    {!isLoading && !isError && fixtureMeta && (
                        <>
                            <p className="mt-2 text-xs font-semibold text-indigo-100">
                                {fixtureMeta.league_name} · {fixtureMeta.division_name}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-indigo-200">
                                {playedAtLabel}
                            </p>
                        </>
                    )}
                </div>

                {/* Scoreboard Card */}
                {!isLoading && !isError && rubbers.length > 0 && (
                    <div className="relative z-10 mt-6 flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                        <div className="flex flex-1 flex-col items-center">
                            <span className="text-3xl font-black text-white">{homeScore}</span>
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                                {fixtureMeta?.home_team_name ?? 'Home'}
                            </span>
                        </div>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/40 font-bold text-white ring-2 ring-indigo-400/30">
                            VS
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                            <span className="text-3xl font-black text-white">{awayScore}</span>
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                                {fixtureMeta?.away_team_name ?? 'Away'}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            <div className="px-5 flex flex-col gap-4 mt-6">
                <div className="mb-2 flex items-center gap-2 px-1">
                    <Swords size={18} className="text-indigo-500" />
                    <h2 className="font-bold text-slate-800">Match Breakdown</h2>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : isError ? (
                    <div className="rounded-3xl bg-red-50 p-6 text-center text-red-600 ring-1 ring-red-100">
                        Failed to load fixture details.
                    </div>
                ) : rubbers.length === 0 ? (
                    <div className="rounded-3xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100 shadow-sm">
                        No matches found for this fixture.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {rubbers.map((rubber) => {
                            const isHomeWin = rubber.home_games_won > rubber.away_games_won;
                            const isAwayWin = rubber.away_games_won > rubber.home_games_won;

                            const homePlayers = [
                                { id: rubber.home_player_1_id, name: rubber.home_player_1_name },
                                ...(rubber.is_doubles ? [{ id: rubber.home_player_2_id, name: rubber.home_player_2_name }] : []),
                            ].filter((player) => Boolean(player.name));
                            const resolvedHomePlayers = homePlayers.length > 0
                                ? homePlayers
                                : [{ id: null, name: 'Unknown' }];

                            const awayPlayers = [
                                { id: rubber.away_player_1_id, name: rubber.away_player_1_name },
                                ...(rubber.is_doubles ? [{ id: rubber.away_player_2_id, name: rubber.away_player_2_name }] : []),
                            ].filter((player) => Boolean(player.name));
                            const resolvedAwayPlayers = awayPlayers.length > 0
                                ? awayPlayers
                                : [{ id: null, name: 'Unknown' }];

                            return (
                                <div key={rubber.id} className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {rubber.is_doubles ? 'Doubles' : 'Singles'}
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-3">
                                        {/* Home Player */}
                                        <div className="flex flex-1 flex-col items-start">
                                            <div className="flex flex-wrap items-center gap-1.5 text-left">
                                                {resolvedHomePlayers.map((player, idx) => (
                                                    <div key={`${rubber.id}-home-${idx}`} className="flex items-center gap-1.5">
                                                        {player.id ? (
                                                            <button
                                                                onClick={() => navigate(`/players/${player.id}`)}
                                                                className={`text-sm font-bold ${isHomeWin ? 'text-indigo-600' : 'text-slate-700'} hover:underline`}
                                                            >
                                                                {player.name}
                                                            </button>
                                                        ) : (
                                                            <span className={`text-sm font-bold ${isHomeWin ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                {player.name}
                                                            </span>
                                                        )}
                                                        {idx < resolvedHomePlayers.length - 1 && (
                                                            <span className="text-xs text-slate-300">&amp;</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Score Pill */}
                                        <div className="flex items-center justify-center rounded-xl bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                                            <span className={`w-4 text-center text-sm font-black ${isHomeWin ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {rubber.home_games_won}
                                            </span>
                                            <span className="mx-1 text-slate-300">-</span>
                                            <span className={`w-4 text-center text-sm font-black ${isAwayWin ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {rubber.away_games_won}
                                            </span>
                                        </div>

                                        {/* Away Player */}
                                        <div className="flex flex-1 flex-col items-end text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-1.5 text-right">
                                                {resolvedAwayPlayers.map((player, idx) => (
                                                    <div key={`${rubber.id}-away-${idx}`} className="flex items-center gap-1.5">
                                                        {idx > 0 && (
                                                            <span className="text-xs text-slate-300">&amp;</span>
                                                        )}
                                                        {player.id ? (
                                                            <button
                                                                onClick={() => navigate(`/players/${player.id}`)}
                                                                className={`text-sm font-bold ${isAwayWin ? 'text-indigo-600' : 'text-slate-700'} hover:underline`}
                                                            >
                                                                {player.name}
                                                            </button>
                                                        ) : (
                                                            <span className={`text-sm font-bold ${isAwayWin ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                {player.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
