import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  apiFetch,
  formatMatchDate,
  getInitials,
  type H2HResponse,
  type PlayerSearchItem,
  type PlayerSearchResponse,
} from './player-shared';
import { AppButtonLink, AppCard, AppCardContent, AppListGroup, AppListItem } from './ui/appkit';

const SEARCH_DEBOUNCE_MS = 250;

interface H2HTabContentProps {
  selectedLeagueIds: string[];
  leagueScopeLabel: string;
  onOpenPlayer: (playerId: string) => void;
}

interface LeagueEncounterSummary {
  latestDate: string;
  league: string;
  played: number;
  playerAWins: number;
  playerBWins: number;
}

function buildPlayerSearchPath(query: string, leagueIds: string[]): string {
  const params = new URLSearchParams();
  const normalized = query.trim();
  if (normalized.length > 0) {
    params.set('q', normalized);
  }
  if (leagueIds.length > 0) {
    params.set('league_ids', leagueIds.join(','));
  }
  return params.size > 0 ? `/players/search?${params.toString()}` : '/players/search';
}

function buildH2HPath(playerId: string, opponentId: string, leagueIds: string[]): string {
  const params = new URLSearchParams();
  if (leagueIds.length > 0) {
    params.set('league_ids', leagueIds.join(','));
  }
  const queryString = params.toString();
  return queryString.length > 0
    ? `/players/${playerId}/h2h/${opponentId}?${queryString}`
    : `/players/${playerId}/h2h/${opponentId}`;
}

export function H2HTabContent({ selectedLeagueIds, leagueScopeLabel, onOpenPlayer }: H2HTabContentProps) {
  const [playerA, setPlayerA] = useState<PlayerSearchItem | null>(null);
  const [playerB, setPlayerB] = useState<PlayerSearchItem | null>(null);

  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');

  const [resultsA, setResultsA] = useState<PlayerSearchItem[]>([]);
  const [resultsB, setResultsB] = useState<PlayerSearchItem[]>([]);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [h2h, setH2h] = useState<H2HResponse | null>(null);
  const [isH2HLoading, setIsH2HLoading] = useState(false);
  const [h2hError, setH2hError] = useState<string | null>(null);

  const sortedLeagueIds = useMemo(() => [...selectedLeagueIds].sort(), [selectedLeagueIds]);
  const selectedLeagueIdsKey = sortedLeagueIds.join(',');
  const normalizedQueryA = queryA.trim();
  const normalizedQueryB = queryB.trim();

  useEffect(() => {
    if (playerA || normalizedQueryA.length <= 2) {
      setResultsA([]);
      setErrorA(null);
      setIsLoadingA(false);
      return;
    }

    const abortController = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        setIsLoadingA(true);
        setErrorA(null);
        const payload = await apiFetch<PlayerSearchResponse>(
          buildPlayerSearchPath(normalizedQueryA, sortedLeagueIds),
          abortController.signal,
        );
        setResultsA((payload.data ?? []).filter((item) => item.id !== playerB?.id));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setResultsA([]);
        setErrorA((error as Error).message || 'Failed to search players');
      } finally {
        setIsLoadingA(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timerId);
    };
  }, [normalizedQueryA, playerA, playerB?.id, selectedLeagueIdsKey, sortedLeagueIds]);

  useEffect(() => {
    if (playerB || normalizedQueryB.length <= 2) {
      setResultsB([]);
      setErrorB(null);
      setIsLoadingB(false);
      return;
    }

    const abortController = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        setIsLoadingB(true);
        setErrorB(null);
        const payload = await apiFetch<PlayerSearchResponse>(
          buildPlayerSearchPath(normalizedQueryB, sortedLeagueIds),
          abortController.signal,
        );
        setResultsB((payload.data ?? []).filter((item) => item.id !== playerA?.id));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setResultsB([]);
        setErrorB((error as Error).message || 'Failed to search players');
      } finally {
        setIsLoadingB(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timerId);
    };
  }, [normalizedQueryB, playerA?.id, playerB, selectedLeagueIdsKey, sortedLeagueIds]);

  useEffect(() => {
    if (!playerA || !playerB) {
      setH2h(null);
      setH2hError(null);
      setIsH2HLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadH2H = async () => {
      try {
        setIsH2HLoading(true);
        setH2hError(null);
        const h2hPayload = await apiFetch<H2HResponse>(
          buildH2HPath(playerA.id, playerB.id, sortedLeagueIds),
          abortController.signal,
        );
        setH2h(h2hPayload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setH2h(null);
        setH2hError((error as Error).message || 'Failed to load H2H data');
      } finally {
        setIsH2HLoading(false);
      }
    };

    loadH2H();
    return () => abortController.abort();
  }, [playerA, playerB, selectedLeagueIdsKey, sortedLeagueIds]);

  const encounterCount = h2h?.encounters.length ?? 0;
  const playerAWinPct = encounterCount > 0 && h2h ? Math.round((h2h.player1_wins / encounterCount) * 100) : 0;
  const playerBWinPct = encounterCount > 0 && h2h ? Math.round((h2h.player2_wins / encounterCount) * 100) : 0;

  const leagueEncounterSummary = useMemo<LeagueEncounterSummary[]>(() => {
    if (!h2h) return [];
    const summaryByLeague = new Map<string, LeagueEncounterSummary>();

    for (const encounter of h2h.encounters) {
      const key = encounter.league || 'Unknown League';
      const current = summaryByLeague.get(key);
      if (!current) {
        summaryByLeague.set(key, {
          league: key,
          played: 1,
          playerAWins: encounter.isWin ? 1 : 0,
          playerBWins: encounter.isWin ? 0 : 1,
          latestDate: encounter.date,
        });
        continue;
      }
      current.played += 1;
      if (encounter.isWin) {
        current.playerAWins += 1;
      } else {
        current.playerBWins += 1;
      }
    }

    return Array.from(summaryByLeague.values())
      .sort((a, b) => b.played - a.played || b.playerAWins - a.playerAWins);
  }, [h2h]);

  const onResetComparison = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setPlayerA(null);
    setPlayerB(null);
    setQueryA('');
    setQueryB('');
    setResultsA([]);
    setResultsB([]);
    setH2h(null);
    setH2hError(null);
  };

  const preventDefault = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <div className="content mt-n4 mb-3">
        <div className="tt-tab-toolbar">
          <div>
            <p className="font-11 opacity-70 mb-1">Compare Players</p>
            <h3 className="mb-0">Head to Head</h3>
          </div>
          {(playerA || playerB) ? (
            <AppButtonLink size="s" tone="outline-highlight" onClick={onResetComparison}>
              Reset
            </AppButtonLink>
          ) : null}
        </div>
      </div>

      <AppCard className="tt-h2h-hero-card bg-6 mt-2" cardHeight={220}>
        <div className="card-top px-3 pt-3">
          <span className="badge bg-white color-black font-11">Head to Head Arena</span>
        </div>
        <div className="card-bottom px-3 pb-3">
          <p className="color-white opacity-70 mb-1">League scope: {leagueScopeLabel}</p>
          {playerA && playerB ? (
            <>
              <h1 className="font-24 line-height-l color-white mb-1">{playerA.name} vs {playerB.name}</h1>
              <p className="color-white opacity-85 mb-0">{encounterCount} recorded encounters</p>
            </>
          ) : (
            <>
              <h1 className="font-24 line-height-l color-white mb-1">Build a Matchup</h1>
              <p className="color-white opacity-85 mb-0">Pick two players to unlock head-to-head analysis.</p>
            </>
          )}
        </div>
        <div className="card-overlay bg-gradient opacity-80" />
        <div className="card-overlay bg-gradient" />
      </AppCard>

      <AppCard className="mt-2">
        <AppCardContent className="mb-1">
          <div className="d-flex mb-2">
            <div className="align-self-center">
              <p className="mb-n1 color-highlight font-600">Matchup Setup</p>
              <h4 className="mb-0">Select Two Players</h4>
            </div>
          </div>

          <div className="tt-h2h-picker-grid">
            <div className="tt-h2h-picker-card">
              <p className="font-11 opacity-60 text-uppercase mb-2">Player A</p>
              {playerA ? (
                <>
                  <div className="tt-h2h-selected-player">
                    <span className="tt-h2h-selected-avatar bg-highlight color-white">{getInitials(playerA.name)}</span>
                    <div>
                      <h5 className="mb-1">{playerA.name}</h5>
                      <p className="font-12 opacity-70 mb-0">{playerA.wins}W · {playerA.played} played</p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <AppButtonLink
                      size="s"
                      tone="outline-highlight"
                      onClick={(event) => {
                        event.preventDefault();
                        setPlayerA(null);
                        setQueryA('');
                        setResultsA([]);
                      }}
                    >
                      Change
                    </AppButtonLink>
                    <AppButtonLink
                      size="s"
                      onClick={(event) => {
                        event.preventDefault();
                        onOpenPlayer(playerA.id);
                      }}
                    >
                      Profile
                    </AppButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <div className="search-box search-dark shadow-xs border-0 bg-theme rounded-sm mb-2">
                    <i className="fa fa-search ms-1" />
                    <input
                      type="text"
                      className="border-0"
                      placeholder="Search player A..."
                      value={queryA}
                      onChange={(event) => setQueryA(event.target.value)}
                    />
                  </div>
                  {normalizedQueryA.length > 0 && normalizedQueryA.length <= 2 ? (
                    <p className="font-12 opacity-70 mb-0">Type at least 3 characters.</p>
                  ) : null}
                  {isLoadingA ? <p className="font-12 mb-0"><i className="fa fa-spinner fa-spin me-1" />Searching...</p> : null}
                  {errorA ? <p className="font-12 color-red-dark mb-0">{errorA}</p> : null}
                  {!isLoadingA && resultsA.length > 0 ? (
                    <div className="list-group list-custom-small tt-h2h-result-list">
                      {resultsA.slice(0, 8).map((player) => (
                        <a
                          key={player.id}
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setPlayerA(player);
                            setQueryA('');
                            setResultsA([]);
                          }}
                        >
                          <i className="tt-h2h-search-avatar bg-highlight color-white">{getInitials(player.name)}</i>
                          <span>{player.name}</span>
                          <strong>{player.wins}W · {player.played} played</strong>
                          <i className="fa fa-angle-right" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="tt-h2h-picker-card">
              <p className="font-11 opacity-60 text-uppercase mb-2">Player B</p>
              {playerB ? (
                <>
                  <div className="tt-h2h-selected-player">
                    <span className="tt-h2h-selected-avatar bg-red-dark color-white">{getInitials(playerB.name)}</span>
                    <div>
                      <h5 className="mb-1">{playerB.name}</h5>
                      <p className="font-12 opacity-70 mb-0">{playerB.wins}W · {playerB.played} played</p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <AppButtonLink
                      size="s"
                      tone="outline-highlight"
                      onClick={(event) => {
                        event.preventDefault();
                        setPlayerB(null);
                        setQueryB('');
                        setResultsB([]);
                      }}
                    >
                      Change
                    </AppButtonLink>
                    <AppButtonLink
                      size="s"
                      onClick={(event) => {
                        event.preventDefault();
                        onOpenPlayer(playerB.id);
                      }}
                    >
                      Profile
                    </AppButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <div className="search-box search-dark shadow-xs border-0 bg-theme rounded-sm mb-2">
                    <i className="fa fa-search ms-1" />
                    <input
                      type="text"
                      className="border-0"
                      placeholder="Search player B..."
                      value={queryB}
                      onChange={(event) => setQueryB(event.target.value)}
                    />
                  </div>
                  {normalizedQueryB.length > 0 && normalizedQueryB.length <= 2 ? (
                    <p className="font-12 opacity-70 mb-0">Type at least 3 characters.</p>
                  ) : null}
                  {isLoadingB ? <p className="font-12 mb-0"><i className="fa fa-spinner fa-spin me-1" />Searching...</p> : null}
                  {errorB ? <p className="font-12 color-red-dark mb-0">{errorB}</p> : null}
                  {!isLoadingB && resultsB.length > 0 ? (
                    <div className="list-group list-custom-small tt-h2h-result-list">
                      {resultsB.slice(0, 8).map((player) => (
                        <a
                          key={player.id}
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setPlayerB(player);
                            setQueryB('');
                            setResultsB([]);
                          }}
                        >
                          <i className="tt-h2h-search-avatar bg-red-dark color-white">{getInitials(player.name)}</i>
                          <span>{player.name}</span>
                          <strong>{player.wins}W · {player.played} played</strong>
                          <i className="fa fa-angle-right" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      {!playerA || !playerB ? (
        <AppCard className="mt-2">
          <AppCardContent>
            <p className="mb-0">Select both players to compare win split and encounter history.</p>
          </AppCardContent>
        </AppCard>
      ) : null}

      {isH2HLoading ? (
        <AppCard className="mt-2">
          <AppCardContent>
            <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading head-to-head...</p>
          </AppCardContent>
        </AppCard>
      ) : null}

      {h2hError ? (
        <AppCard className="mt-2">
          <AppCardContent>
            <p className="mb-0 color-red-dark">Failed to load H2H: {h2hError}</p>
          </AppCardContent>
        </AppCard>
      ) : null}

      {h2h && playerA && playerB ? (
        <>
          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <p className="mb-n1 color-highlight font-600">Matchup Score</p>
              <h4 className="mb-2">{encounterCount} Total Encounters</h4>

              <div className="tt-h2h-duel-grid">
                <div className="tt-h2h-duel-side">
                  <span className="tt-h2h-duel-name">{playerA.name}</span>
                  <strong className="tt-h2h-duel-score">{h2h.player1_wins}</strong>
                  <span className="tt-h2h-duel-rate">{playerAWinPct}% wins</span>
                </div>
                <div className="tt-h2h-duel-vs">VS</div>
                <div className="tt-h2h-duel-side">
                  <span className="tt-h2h-duel-name">{playerB.name}</span>
                  <strong className="tt-h2h-duel-score">{h2h.player2_wins}</strong>
                  <span className="tt-h2h-duel-rate">{playerBWinPct}% wins</span>
                </div>
              </div>

              <div className="tt-h2h-bar mt-2" role="img" aria-label="Win split">
                <div className="tt-h2h-bar-a" style={{ width: `${playerAWinPct}%` }} />
                <div className="tt-h2h-bar-b" style={{ width: `${playerBWinPct}%` }} />
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <p className="mb-n1 color-highlight font-600">Most Repeated Encounters</p>
              <h4 className="mb-2">{playerA.name} vs {playerB.name}</h4>
              {encounterCount === 0 ? (
                <p className="mb-0">No repeated encounters found in the selected league scope.</p>
              ) : (
                <>
                  <p className="font-12 opacity-70 mb-2">
                    This matchup has been played <strong>{encounterCount}</strong> times.
                  </p>
                  <AppListGroup size="small" className="tt-h2h-repeated-list">
                    {leagueEncounterSummary.slice(0, 5).map((summary, index) => (
                      <AppListItem
                        key={`${summary.league}-${index}`}
                        iconClassName="fa fa-repeat rounded-xl shadow-xl bg-blue-dark color-white"
                        title={`${index + 1}. ${summary.league}`}
                        subtitle={`${summary.played} matches · ${summary.playerAWins}-${summary.playerBWins} · Latest ${formatMatchDate(summary.latestDate)}`}
                        onClick={preventDefault}
                        borderless={index === Math.min(leagueEncounterSummary.length, 5) - 1}
                      />
                    ))}
                  </AppListGroup>
                </>
              )}
            </AppCardContent>
          </AppCard>

          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <p className="mb-n1 color-highlight font-600">Encounter History</p>
              <h4 className="mb-2">Past Matches</h4>
              {h2h.encounters.length === 0 ? (
                <p className="mb-0">No past encounters found.</p>
              ) : (
                <AppListGroup size="small">
                  {h2h.encounters.map((encounter, index) => (
                    <AppListItem
                      key={encounter.id}
                      iconClassName={`fa ${encounter.isWin ? 'fa-check' : 'fa-times'} rounded-xl shadow-xl ${encounter.isWin ? 'bg-green-dark' : 'bg-red-dark'} color-white`}
                      title={encounter.league}
                      subtitle={`${formatMatchDate(encounter.date)} · ${encounter.result}`}
                      onClick={preventDefault}
                      borderless={index === h2h.encounters.length - 1}
                    />
                  ))}
                </AppListGroup>
              )}
            </AppCardContent>
          </AppCard>
        </>
      ) : null}
    </>
  );
}
