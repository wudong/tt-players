import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  apiFetch,
  formatMatchDate,
  type ExtendedPlayerStats,
  type H2HResponse,
  type PlayerSearchItem,
  type PlayerSearchResponse,
} from './player-shared';
import { AppButtonLink, AppCard, AppCardContent, AppListGroup, AppListItem } from './ui/appkit';

const SEARCH_DEBOUNCE_MS = 250;

interface H2HTabContentProps {
  selectedLeagueIds: string[];
  onOpenLeagueFilter: (event: MouseEvent<HTMLAnchorElement>) => void;
  onOpenPlayer: (playerId: string) => void;
}

function overallWinRate(player: PlayerSearchItem, stats: ExtendedPlayerStats | null): number {
  if (stats && stats.total > 0) {
    return Math.round((stats.wins / stats.total) * 100);
  }
  return player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0;
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

export function H2HTabContent({ selectedLeagueIds, onOpenLeagueFilter, onOpenPlayer }: H2HTabContentProps) {
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
  const [statsA, setStatsA] = useState<ExtendedPlayerStats | null>(null);
  const [statsB, setStatsB] = useState<ExtendedPlayerStats | null>(null);

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
      setStatsA(null);
      setStatsB(null);
      setH2hError(null);
      setIsH2HLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadH2H = async () => {
      try {
        setIsH2HLoading(true);
        setH2hError(null);

        const [h2hPayload, playerAStatsPayload, playerBStatsPayload] = await Promise.all([
          apiFetch<H2HResponse>(`/players/${playerA.id}/h2h/${playerB.id}`, abortController.signal),
          apiFetch<ExtendedPlayerStats>(`/players/${playerA.id}/stats/extended`, abortController.signal),
          apiFetch<ExtendedPlayerStats>(`/players/${playerB.id}/stats/extended`, abortController.signal),
        ]);

        setH2h(h2hPayload);
        setStatsA(playerAStatsPayload);
        setStatsB(playerBStatsPayload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setH2h(null);
        setStatsA(null);
        setStatsB(null);
        setH2hError((error as Error).message || 'Failed to load H2H data');
      } finally {
        setIsH2HLoading(false);
      }
    };

    loadH2H();
    return () => abortController.abort();
  }, [playerA, playerB]);

  const h2hTotal = h2h ? h2h.player1_wins + h2h.player2_wins : 0;
  const playerAWinPct = h2hTotal > 0 && h2h ? Math.round((h2h.player1_wins / h2hTotal) * 100) : 0;
  const playerBWinPct = h2hTotal > 0 && h2h ? Math.round((h2h.player2_wins / h2hTotal) * 100) : 0;

  const onResetComparison = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setPlayerA(null);
    setPlayerB(null);
    setQueryA('');
    setQueryB('');
    setResultsA([]);
    setResultsB([]);
    setH2h(null);
    setStatsA(null);
    setStatsB(null);
    setH2hError(null);
  };

  return (
    <>
      <div className="content mt-n4 mb-3">
        <div className="tt-tab-toolbar">
          <div>
            <p className="font-11 opacity-70 mb-1">Compare Players</p>
            <h3 className="mb-0">Head to Head</h3>
          </div>
          <a
            href="#"
            data-menu="menu-leagues"
            onClick={onOpenLeagueFilter}
            className="tt-league-trigger btn btn-s shadow-s rounded-s font-600 bg-highlight color-white text-uppercase"
          >
            <i className="fa fa-filter me-1" />
            Leagues ({selectedLeagueIds.length})
          </a>
        </div>
      </div>

      <AppCard className="mt-2">
        <AppCardContent className="mb-1">
          <div className="d-flex mb-2">
            <div className="align-self-center">
              <p className="mb-n1 color-highlight font-600">Players</p>
              <h4 className="mb-0">Select Two Players</h4>
            </div>
            {(playerA || playerB) ? (
              <div className="ms-auto align-self-center">
                <AppButtonLink tone="outline-highlight" size="s" onClick={onResetComparison}>Reset</AppButtonLink>
              </div>
            ) : null}
          </div>

          <div className="tt-h2h-picker-grid">
            <div className="tt-h2h-picker-card">
              <p className="font-11 opacity-60 text-uppercase mb-2">Player A</p>
              {playerA ? (
                <div>
                  <h5 className="mb-1">{playerA.name}</h5>
                  <p className="font-12 opacity-70 mb-2">{playerA.wins}W · {playerA.played} played</p>
                  <div className="d-flex gap-2">
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
                </div>
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
                          <i className="fa fa-user rounded-xl shadow-xl bg-highlight color-white" />
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
                <div>
                  <h5 className="mb-1">{playerB.name}</h5>
                  <p className="font-12 opacity-70 mb-2">{playerB.wins}W · {playerB.played} played</p>
                  <div className="d-flex gap-2">
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
                </div>
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
                          <i className="fa fa-user rounded-xl shadow-xl bg-highlight color-white" />
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
              <p className="mb-n1 color-highlight font-600">Matchups</p>
              <h4 className="mb-2">{h2hTotal} Encounters</h4>

              <div className="tt-h2h-scoreboard">
                <div>
                  <strong>{h2h.player1_wins}</strong>
                  <span>{playerA.name}</span>
                </div>
                <div>
                  <strong>{h2h.player2_wins}</strong>
                  <span>{playerB.name}</span>
                </div>
              </div>

              <div className="tt-h2h-bar" role="img" aria-label="Win split">
                <div className="tt-h2h-bar-a" style={{ width: `${playerAWinPct}%` }} />
                <div className="tt-h2h-bar-b" style={{ width: `${playerBWinPct}%` }} />
              </div>

              <div className="d-flex mt-2">
                <span className="badge bg-green-dark color-white">{overallWinRate(playerA, statsA)}% WR</span>
                <span className="badge bg-red-dark color-white ms-2">{overallWinRate(playerB, statsB)}% WR</span>
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <p className="mb-n1 color-highlight font-600">History</p>
              <h4 className="mb-2">Past Encounters</h4>
              {h2h.encounters.length === 0 ? (
                <p className="mb-0">No past encounters found.</p>
              ) : (
                <AppListGroup size="small">
                  {h2h.encounters.map((encounter, index) => (
                    <AppListItem
                      key={encounter.id}
                      iconClassName={`fa ${encounter.isWin ? 'fa-check' : 'fa-times'} rounded-xl shadow-xl ${encounter.isWin ? 'bg-green-dark' : 'bg-red-dark'} color-white`}
                      title={`${formatMatchDate(encounter.date)} · ${encounter.league}`}
                      subtitle={`${encounter.result} · ${encounter.isWin ? playerA.name : playerB.name} won`}
                      onClick={(event) => event.preventDefault()}
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
