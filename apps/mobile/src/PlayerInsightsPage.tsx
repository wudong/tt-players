import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './app-shell.css';
import { apiFetch, type ExtendedPlayerStats, type PlayerInsights } from './player-shared';

export function PlayerInsightsPage() {
  const navigate = useNavigate();
  const { playerId = '' } = useParams<{ playerId: string }>();

  const [stats, setStats] = useState<ExtendedPlayerStats | null>(null);
  const [insights, setInsights] = useState<PlayerInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const momentum = insights?.form.momentum ?? 'new';

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(`/players/${playerId}`);
  };

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/');
  };

  useEffect(() => {
    if (!playerId) {
      setError('Missing player id');
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsPayload, insightsPayload] = await Promise.all([
          apiFetch<ExtendedPlayerStats>(`/players/${playerId}/stats/extended`, abortController.signal),
          apiFetch<PlayerInsights>(`/players/${playerId}/insights`, abortController.signal),
        ]);

        setStats(statsPayload);
        setInsights(insightsPayload);
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') return;
        setStats(null);
        setInsights(null);
        setError((fetchError as Error).message || 'Failed to load insights');
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      abortController.abort();
    };
  }, [playerId]);

  return (
    <div id="page" className="app-shell-page">
      <header className="header header-fixed header-logo-center">
        <a href="#" className="header-title" onClick={goHome}>{stats?.player_name ?? 'Insights'}</a>
        <a href="#" className="header-icon header-icon-1" onClick={goBack}><i className="fas fa-chevron-left" /></a>
        <a href="#" className="header-icon header-icon-4" onClick={goHome}><i className="fas fa-home" /></a>
      </header>

      <div className="header-clear-medium" />

      <main className="page-content app-shell-content">
        {isLoading ? (
          <div className="card card-style"><div className="content"><p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading insights...</p></div></div>
        ) : error || !stats || !insights ? (
          <div className="card card-style"><div className="content"><p className="mb-2 color-red-dark">Failed to load insights.</p><a href="#" className="btn btn-s rounded-s bg-highlight color-white" onClick={goBack}>Back</a></div></div>
        ) : (
          <>
            <div className="card card-style bg-6" data-card-height="230">
              <div className="card-bottom ms-3 me-3 mb-3">
                <p className="color-white opacity-60 mb-1">Insights Overview</p>
                <h1 className="font-28 line-height-l color-white mb-1">{stats.player_name}</h1>
                <p className="color-white opacity-80 mb-0 text-capitalize">Momentum: {momentum}</p>
              </div>
              <div className="card-overlay bg-gradient" />
            </div>

            <div className="card card-style">
              <div className="content mb-2">
                <p className="mb-n1 color-highlight font-600">Rival Intelligence</p>
                <h4>Trends</h4>
                <div className="list-group list-custom-small">
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    <i className="fa fa-bolt rounded-xl shadow-xl bg-red-dark color-white" />
                    <span>Toughest: {insights.rivals.toughest ? `${insights.rivals.toughest.opponent_name} (${insights.rivals.toughest.win_rate}% WR)` : 'N/A'}</span>
                    <i className="fa fa-angle-right" />
                  </a>
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    <i className="fa fa-smile rounded-xl shadow-xl bg-green-dark color-white" />
                    <span>Easiest: {insights.rivals.easiest ? `${insights.rivals.easiest.opponent_name} (${insights.rivals.easiest.win_rate}% WR)` : 'N/A'}</span>
                    <i className="fa fa-angle-right" />
                  </a>
                  <a href="#" onClick={(event) => event.preventDefault()} className="border-0">
                    <i className="fa fa-arrow-up rounded-xl shadow-xl bg-blue-dark color-white" />
                    <span>Improving vs: {insights.rivals.improving_vs ? `${insights.rivals.improving_vs.opponent_name} (+${insights.rivals.improving_vs.delta_points})` : 'N/A'}</span>
                    <i className="fa fa-angle-right" />
                  </a>
                </div>
              </div>
            </div>

            <div className="card card-style">
              <div className="content mb-2">
                <p className="mb-n1 color-highlight font-600">Career</p>
                <h4>Timeline</h4>
                {insights.career_by_year.length === 0 ? (
                  <p className="mb-0">Not enough history yet.</p>
                ) : (
                  <div className="list-group list-custom-small">
                    {insights.career_by_year.map((year, index) => (
                      <a key={year.year} href="#" onClick={(event) => event.preventDefault()} className={index === insights.career_by_year.length - 1 ? 'border-0' : undefined}>
                        <i className="fa fa-calendar-alt rounded-xl shadow-xl bg-green-dark color-white" />
                        <span>{year.year} · {year.played} played · {year.win_rate}% WR</span>
                        <i className="fa fa-angle-right" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
