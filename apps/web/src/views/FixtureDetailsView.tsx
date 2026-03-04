import { Swords, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureRubbers } from '../hooks/useFixtureRubbers';

export function FixtureDetailsView() {
    const { fixtureId = '' } = useParams<{ fixtureId: string }>();
    const navigate = useNavigate();

    const { data: rubbersData, isLoading, isError } = useFixtureRubbers(fixtureId);
    const rubbers = rubbersData?.data || [];

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
                </div>

                {/* Scoreboard Card */}
                {!isLoading && !isError && rubbers.length > 0 && (
                    <div className="relative z-10 mt-6 flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                        <div className="flex flex-1 flex-col items-center">
                            <span className="text-3xl font-black text-white">{homeScore}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Home</span>
                        </div>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/40 font-bold text-white ring-2 ring-indigo-400/30">
                            VS
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                            <span className="text-3xl font-black text-white">{awayScore}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Away</span>
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
                        {rubbers.map((rubber, index) => {
                            const isHomeWin = rubber.home_games_won > rubber.away_games_won;
                            const isAwayWin = rubber.away_games_won > rubber.home_games_won;

                            // Format names for doubles if needed
                            const homeName = rubber.is_doubles
                                ? `${rubber.home_player_1_name?.split(' ')[0] || 'Unknown'} & ${rubber.home_player_2_name?.split(' ')[0] || 'Unknown'}`
                                : rubber.home_player_1_name || 'Unknown';

                            const awayName = rubber.is_doubles
                                ? `${rubber.away_player_1_name?.split(' ')[0] || 'Unknown'} & ${rubber.away_player_2_name?.split(' ')[0] || 'Unknown'}`
                                : rubber.away_player_1_name || 'Unknown';

                            return (
                                <div key={rubber.id} className="relative flex flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-slate-200"></div>

                                    <div className="mb-3 flex items-center justify-between border-b border-slate-50 pb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match {index + 1} {rubber.is_doubles ? '(Doubles)' : ''}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Home Player */}
                                        <div className="flex flex-1 flex-col items-start">
                                            <span className={`text-sm font-bold ${isHomeWin ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {homeName}
                                            </span>
                                        </div>

                                        {/* Score Pill */}
                                        <div className="flex items-center justify-center rounded-xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
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
                                            <span className={`text-sm font-bold ${isAwayWin ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {awayName}
                                            </span>
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
