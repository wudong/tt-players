import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './app-shell.css';
import { apiFetch, formatMatchDate, type ExtendedPlayerStats, type RubberItem, type RubbersResponse } from './player-shared';

const PAGE_SIZE = 20;

export function PlayerMatchesPage() {
  const navigate = useNavigate();
  const { playerId = '' } = useParams<{ playerId: string }>();

  const [stats, setStats] = useState<ExtendedPlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [matches, setMatches] = useState<RubberItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesLoadingMore, setMatchesLoadingMore] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const hasMore = useMemo(() => matches.length < total, [matches.length, total]);

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(`/players/${playerId}`);
  };

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/');
  };

  const onLoadMore = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (matchesLoadingMore || !hasMore) return;
    setOffset((previous) => previous + PAGE_SIZE);
  };

  useEffect(() => {
    if (!playerId) {
      setStats(null);
      setStatsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const payload = await apiFetch<ExtendedPlayerStats>(`/players/${playerId}/stats/extended`, abortController.signal);
        setStats(payload);
      } catch {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();

    return () => {
      abortController.abort();
    };
  }, [playerId]);

  useEffect(() => {
    if (!playerId) {
      setMatches([]);
      setTotal(0);
      setMatchesError('Missing player id');
      setMatchesLoading(false);
      setMatchesLoadingMore(false);
      return;
    }

    const abortController = new AbortController();

    const loadMatches = async () => {
      try {
        if (offset === 0) {
          setMatchesLoading(true);
        } else {
          setMatchesLoadingMore(true);
        }
        setMatchesError(null);

        const payload = await apiFetch<RubbersResponse>(
          `/players/${playerId}/rubbers?limit=${PAGE_SIZE}&offset=${offset}`,
          abortController.signal,
        );

        setTotal(payload.total);
        setMatches((previous) => {
          if (offset === 0) return payload.data;
          const existingIds = new Set(previous.map((item) => item.id));
          return [...previous, ...payload.data.filter((item) => !existingIds.has(item.id))];
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        if (offset === 0) {
          setMatches([]);
          setTotal(0);
        }
        setMatchesError((error as Error).message || 'Failed to load matches');
      } finally {
        setMatchesLoading(false);
        setMatchesLoadingMore(false);
      }
    };

    loadMatches();

    return () => {
      abortController.abort();
    };
  }, [offset, playerId]);

  useEffect(() => {
    setOffset(0);
    setMatches([]);
    setTotal(0);
    setMatchesError(null);
  }, [playerId]);

  return (
    <div id="page" className="app-shell-page">
      <header className="header header-fixed header-logo-center">
        <a href="#" className="header-title" onClick={goHome}>
          {statsLoading ? 'Match History' : stats?.player_name ?? 'Match History'}
        </a>
        <a href="#" className="header-icon header-icon-1" onClick={goBack}><i className="fas fa-chevron-left" /></a>
        <a href="#" className="header-icon header-icon-4" onClick={goHome}><i className="fas fa-home" /></a>
      </header>

      <div className="header-clear-medium" />

      <main className="page-content app-shell-content">
        <div className="card card-style">
          <div className="content mb-2">
            <p className="mb-n1 color-highlight font-600">Player Matches</p>
            <h4>Full Match List</h4>
            {matchesLoading && matches.length === 0 ? (
              <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading matches...</p>
            ) : matchesError && matches.length === 0 ? (
              <div>
                <p className="mb-3 color-red-dark">Failed to load match history.</p>
                <a href="#" className="btn btn-s rounded-s bg-highlight color-white font-600" onClick={goBack}>Back to Player</a>
              </div>
            ) : matches.length === 0 ? (
              <p className="mb-0">No matches available for this player.</p>
            ) : (
              <>
                <div className="list-group list-custom-large">
                  {matches.map((match, index) => (
                    <a
                      href="#"
                      key={match.id}
                      onClick={(event) => event.preventDefault()}
                      className={index === matches.length - 1 ? 'border-0' : undefined}
                    >
                      <i className={`fa ${match.isWin ? 'fa-check' : 'fa-times'} rounded-xl shadow-xl ${match.isWin ? 'bg-green-dark' : 'bg-red-dark'} color-white`} />
                      <span>{match.opponent} · {match.result}</span>
                      <strong>{formatMatchDate(match.date)} · {match.league}</strong>
                      <i className="fa fa-angle-right" />
                    </a>
                  ))}
                </div>
                <p className="font-11 opacity-70 mt-3 mb-0">Showing {matches.length} of {total} matches</p>
              </>
            )}

            {matchesError && matches.length > 0 ? (
              <p className="mt-3 mb-0 color-red-dark font-12">Could not load more matches. Try again.</p>
            ) : null}

            {hasMore && matches.length > 0 ? (
              <a
                href="#"
                className={`btn btn-full btn-sm rounded-s font-600 font-13 mt-3 ${matchesLoadingMore ? 'bg-gray-dark' : 'bg-highlight'}`}
                onClick={onLoadMore}
              >
                {matchesLoadingMore ? 'Loading...' : 'Load More Matches'}
              </a>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
