import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './app-shell.css';
import {
  FAVOURITES_UPDATED_EVENT,
  apiFetch,
  formatMatchDate,
  getInitials,
  parseStoredFavouritePlayers,
  persistFavouritePlayers,
  type ExtendedPlayerStats,
  type FavouritePlayer,
  type PlayerCurrentSeasonAffiliation,
  type PlayerCurrentSeasonAffiliationsResponse,
  type PlayerInsights,
  type RubbersResponse,
  type RubberItem,
} from './player-shared';

export function PlayerPage() {
  const navigate = useNavigate();
  const { playerId = '' } = useParams<{ playerId: string }>();

  const [stats, setStats] = useState<ExtendedPlayerStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [affiliations, setAffiliations] = useState<PlayerCurrentSeasonAffiliation[]>([]);
  const [affiliationsError, setAffiliationsError] = useState<string | null>(null);
  const [affiliationsLoading, setAffiliationsLoading] = useState(true);
  const [recentMatches, setRecentMatches] = useState<RubberItem[]>([]);
  const [recentMatchesError, setRecentMatchesError] = useState<string | null>(null);
  const [recentMatchesLoading, setRecentMatchesLoading] = useState(true);
  const [insights, setInsights] = useState<PlayerInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [favouritePlayers, setFavouritePlayers] = useState<FavouritePlayer[]>(() => parseStoredFavouritePlayers());

  const winRate = useMemo(() => {
    if (!stats || stats.total <= 0) return 0;
    return Math.round((stats.wins / stats.total) * 100);
  }, [stats]);

  const isFavourite = useMemo(() => {
    if (!stats) return false;
    return favouritePlayers.some((player) => player.id === stats.player_id);
  }, [favouritePlayers, stats]);
  const recentResults = useMemo(() => (insights?.form.recent_results ?? []).slice(0, 10), [insights]);

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/');
  };

  const onToggleFavourite = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!stats) return;

    setFavouritePlayers((previous) => {
      const exists = previous.some((player) => player.id === stats.player_id);
      const next = exists
        ? previous.filter((player) => player.id !== stats.player_id)
        : [{
          id: stats.player_id,
          name: stats.player_name,
          played: stats.total,
          wins: stats.wins,
        }, ...previous.filter((player) => player.id !== stats.player_id)];

      persistFavouritePlayers(next);
      return next;
    });
  };

  const openSection =
    (path: string) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(path);
    };

  useEffect(() => {
    const syncFromStorage = () => {
      setFavouritePlayers(parseStoredFavouritePlayers());
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!playerId) {
      setStats(null);
      setStatsError('Missing player id');
      setStatsLoading(false);
      setAffiliations([]);
      setAffiliationsError('Missing player id');
      setAffiliationsLoading(false);
      setRecentMatches([]);
      setRecentMatchesError('Missing player id');
      setRecentMatchesLoading(false);
      setInsights(null);
      setInsightsLoading(false);
      setInsightsError('Missing player id');
      return;
    }

    const abortController = new AbortController();
    let isActive = true;

    const loadProfile = async () => {
      setStatsLoading(true);
      setAffiliationsLoading(true);
      setRecentMatchesLoading(true);
      setInsightsLoading(true);
      setStatsError(null);
      setAffiliationsError(null);
      setRecentMatchesError(null);
      setInsightsError(null);

      try {
        const [statsResult, affiliationsResult, rubbersResult, insightsResult] = await Promise.allSettled([
          apiFetch<ExtendedPlayerStats>(`/players/${playerId}/stats/extended`, abortController.signal),
          apiFetch<PlayerCurrentSeasonAffiliationsResponse>(`/players/${playerId}/affiliations/current-season`, abortController.signal),
          apiFetch<RubbersResponse>(`/players/${playerId}/rubbers?limit=10&offset=0`, abortController.signal),
          apiFetch<PlayerInsights>(`/players/${playerId}/insights`, abortController.signal),
        ]);
        if (!isActive) return;

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
          setStatsError(null);
        } else {
          const reason = statsResult.reason as Error;
          if (reason.name !== 'AbortError') {
            setStats(null);
            setStatsError(reason.message || 'Failed to load player profile');
          }
        }

        if (affiliationsResult.status === 'fulfilled') {
          setAffiliations(affiliationsResult.value.data ?? []);
          setAffiliationsError(null);
        } else {
          const reason = affiliationsResult.reason as Error;
          if (reason.name !== 'AbortError') {
            setAffiliations([]);
            setAffiliationsError(reason.message || 'Failed to load current season clubs');
          }
        }

        if (rubbersResult.status === 'fulfilled') {
          setRecentMatches(rubbersResult.value.data ?? []);
          setRecentMatchesError(null);
        } else {
          const reason = rubbersResult.reason as Error;
          if (reason.name !== 'AbortError') {
            setRecentMatches([]);
            setRecentMatchesError(reason.message || 'Failed to load recent matches');
          }
        }

        if (insightsResult.status === 'fulfilled') {
          setInsights(insightsResult.value);
          setInsightsError(null);
        } else {
          const reason = insightsResult.reason as Error;
          if (reason.name !== 'AbortError') {
            setInsights(null);
            setInsightsError(reason.message || 'Failed to load form insights');
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError' || !isActive) return;
        setStats(null);
        setStatsError((error as Error).message || 'Failed to load player profile');
      } finally {
        if (!isActive) return;
        setStatsLoading(false);
        setAffiliationsLoading(false);
        setRecentMatchesLoading(false);
        setInsightsLoading(false);
      }
    };

    loadProfile();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [playerId]);

  return (
    <div id="page" className="app-shell-page">
      <header className="header header-fixed header-logo-center">
        <a href="#" className="header-title" onClick={goHome}>{stats?.player_name ?? 'Player'}</a>
        <a href="#" className="header-icon header-icon-1" onClick={goBack}><i className="fas fa-chevron-left" /></a>
        <a href="#" className="header-icon header-icon-4" onClick={goHome}><i className="fas fa-home" /></a>
      </header>

      <div className="header-clear-medium" />

      <main className="page-content app-shell-content">
        {statsLoading ? (
          <div className="card card-style">
            <div className="content">
              <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading player profile...</p>
            </div>
          </div>
        ) : !stats ? (
          <div className="card card-style">
            <div className="content">
              <h4 className="mb-2">Player not available</h4>
              <p className="mb-3">{statsError || 'Failed to load this player profile.'}</p>
              <a href="#" className="btn btn-s rounded-s bg-highlight color-white font-600" onClick={goHome}>Back Home</a>
            </div>
          </div>
        ) : (
          <>
            <div className="card card-style">
              <div className="d-flex content mb-1">
                <div className="flex-grow-1">
                  <h2>{stats.player_name}<i className="fa fa-check-circle color-blue-dark font-16 ms-2" /></h2>
                  <p className="mb-2 mt-3 me-3">
                    Profile summary for quick access to insights, match history and season affiliations.
                  </p>
                  <p className="font-10 mb-0">
                    <strong className="color-theme pe-1">{winRate}%</strong>Win Rate
                    <strong className="color-theme ps-3 pe-1">{stats.total}</strong>Matches
                  </p>
                </div>
                <div className="tt-player-summary-avatar align-self-center">
                  <span className="tt-player-summary-initials">{getInitials(stats.player_name)}</span>
                </div>
              </div>
              <div className="content mb-0">
                <div className="row mb-0">
                  <div className="col-4">
                    <a href="#" className="btn btn-full btn-sm rounded-s font-600 font-13 bg-highlight" onClick={onToggleFavourite}>
                      {isFavourite ? 'Saved Favourite' : 'Save Favourite'}
                    </a>
                  </div>
                  <div className="col-4">
                    <a href="#" className="btn btn-full btn-sm rounded-s font-600 font-13 color-highlight border-highlight" onClick={openSection(`/players/${playerId}/insights`)}>
                      Insights
                    </a>
                  </div>
                  <div className="col-4">
                    <a href="#" className="btn btn-full btn-sm rounded-s font-600 font-13 color-highlight border-highlight" onClick={goHome}>
                      Back Home
                    </a>
                  </div>
                </div>
              </div>
              <div className="tt-player-summary-divider" />
              <div className="content mb-2">
                <div className="row text-center row-cols-3 mb-n1">
                  <div className="col mb-3">
                    <div className="tt-player-chip">
                      <h5 className="mb-0">{stats.wins}</h5>
                      <p className="font-10 mb-0">Wins</p>
                    </div>
                  </div>
                  <div className="col mb-3">
                    <div className="tt-player-chip">
                      <h5 className="mb-0">{stats.losses}</h5>
                      <p className="font-10 mb-0">Losses</p>
                    </div>
                  </div>
                  <div className="col mb-3">
                    <div className="tt-player-chip">
                      <h5 className="mb-0">{stats.streak || '-'}</h5>
                      <p className="font-10 mb-0">Streak</p>
                    </div>
                  </div>
                </div>
                <div className="tt-form-recent mt-1">
                  <span className="tt-form-recent-label">Recent</span>
                  {insightsLoading ? (
                    <span className="tt-form-recent-empty">Loading...</span>
                  ) : recentResults.length === 0 ? (
                    <span className="tt-form-recent-empty">-</span>
                  ) : (
                    <div className="tt-form-recent-list">
                      {recentResults.map((result, index) => (
                        <span
                          key={`${result}-${index}`}
                          className={`tt-form-result-pill ${result === 'W' ? 'tt-form-result-win' : 'tt-form-result-loss'}`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card card-style">
              <div className="content mb-2">
                <div className="d-flex mb-2">
                  <div className="align-self-center">
                    <h1 className="mb-0 font-16">Current Season</h1>
                  </div>
                  <div className="ms-auto align-self-center">
                    <span className="font-11 opacity-60">{affiliations.length} teams</span>
                  </div>
                </div>
                {affiliationsLoading ? (
                  <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading current season clubs...</p>
                ) : affiliationsError ? (
                  <p className="mb-0 color-red-dark">Unable to load current season clubs.</p>
                ) : affiliations.length === 0 ? (
                  <p className="mb-0">No active-season clubs found.</p>
                ) : (
                  <div className="list-group list-custom-large tt-season-list">
                    {affiliations.map((affiliation, index) => (
                      <a
                        href="#"
                        key={`${affiliation.team_id}-${affiliation.competition_name}-${affiliation.season_id}`}
                        onClick={(event) => event.preventDefault()}
                        className={index === affiliations.length - 1 ? 'border-0' : undefined}
                      >
                        <i className="fa fa-table-tennis rounded-xl shadow-xl bg-blue-dark color-white" />
                        <span>{affiliation.team_name}</span>
                        <strong>{affiliation.league_name} · {affiliation.competition_name} · {affiliation.season_name}</strong>
                        <i className="fa fa-angle-right" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card card-style">
              <div className="content mb-2">
                <div className="d-flex mb-2">
                  <div className="align-self-center">
                    <h1 className="mb-0 font-16">Form</h1>
                  </div>
                  <div className="ms-auto align-self-center">
                    <span className="font-11 opacity-60">Rolling performance</span>
                  </div>
                </div>
                {insightsLoading ? (
                  <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading form insights...</p>
                ) : insightsError || !insights ? (
                  <p className="mb-0 color-red-dark">Unable to load form insights.</p>
                ) : (
                  <>
                    <div className="row text-center row-cols-3 mb-0">
                      <div className="col mb-3">
                        <div className="tt-player-chip">
                          <h5 className="mb-0">{insights.form.rolling_10_win_rate}%</h5>
                          <p className="font-10 mb-0">Rolling 10</p>
                        </div>
                      </div>
                      <div className="col mb-3">
                        <div className="tt-player-chip">
                          <h5 className="mb-0">{insights.form.rolling_20_win_rate}%</h5>
                          <p className="font-10 mb-0">Rolling 20</p>
                        </div>
                      </div>
                      <div className="col mb-3">
                        <div className="tt-player-chip">
                          <h5 className="mb-0 text-capitalize">{insights.form.momentum}</h5>
                          <p className="font-10 mb-0">Momentum</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card card-style">
              <div className="content mb-2">
                <div className="d-flex mb-2">
                  <div className="align-self-center">
                    <h1 className="mb-0 font-16">Last 10 Matches</h1>
                  </div>
                  <div className="ms-auto align-self-center">
                    <span className="font-11 opacity-60">{recentMatches.length} matches</span>
                  </div>
                </div>
                {recentMatchesLoading ? (
                  <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading recent matches...</p>
                ) : recentMatchesError ? (
                  <p className="mb-0 color-red-dark">Unable to load recent matches.</p>
                ) : recentMatches.length === 0 ? (
                  <p className="mb-3">No recent matches found.</p>
                ) : (
                  <>
                    <div className="list-group list-custom-large">
                      {recentMatches.map((match, index) => (
                        <a
                          href="#"
                          key={match.id}
                          onClick={(event) => event.preventDefault()}
                          className={index === recentMatches.length - 1 ? 'border-0' : undefined}
                        >
                          <i className={`fa ${match.isWin ? 'fa-check' : 'fa-times'} rounded-xl shadow-xl ${match.isWin ? 'bg-green-dark' : 'bg-red-dark'} color-white`} />
                          <span>{match.opponent} · {match.result}</span>
                          <strong>{formatMatchDate(match.date)} · {match.league}</strong>
                          <i className="fa fa-angle-right" />
                        </a>
                      ))}
                    </div>
                    <a
                      href="#"
                      className="btn btn-full btn-sm rounded-s font-600 font-13 bg-highlight mt-3"
                      onClick={openSection(`/players/${playerId}/matches`)}
                    >
                      View Full Match List
                    </a>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
