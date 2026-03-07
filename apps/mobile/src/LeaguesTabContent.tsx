import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  apiFetch,
  type LeaderboardMode,
  type LeadersResponse,
  type LeagueSeasonsResponse,
  type LeagueWithDivisions,
  type LeaguesResponse,
  type StandingsResponse,
} from './player-shared';
import { AppButtonLink, AppCard, AppCardContent, AppListGroup, AppListItem } from './ui/appkit';

type LeaguesView = 'tables' | 'leaders';

const MIN_PLAYED = 3;

interface LeaguesTabContentProps {
  selectedLeagueIds: string[];
  onOpenLeagueFilter: (event: MouseEvent<HTMLAnchorElement>) => void;
  onOpenPlayer: (playerId: string) => void;
}

export function LeaguesTabContent({ selectedLeagueIds, onOpenLeagueFilter, onOpenPlayer }: LeaguesTabContentProps) {
  const [view, setView] = useState<LeaguesView>('tables');
  const [seasonOptions, setSeasonOptions] = useState<Array<{ id: string; name: string; is_active: boolean }>>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [allSeasonLeagues, setAllSeasonLeagues] = useState<LeagueWithDivisions[]>([]);
  const [isSeasonOptionsLoading, setIsSeasonOptionsLoading] = useState(true);
  const [isLeaguesLoading, setIsLeaguesLoading] = useState(true);
  const [seasonOptionsError, setSeasonOptionsError] = useState<string | null>(null);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [isStandingsLoading, setIsStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  const [leadersMode, setLeadersMode] = useState<LeaderboardMode>('combined');
  const [leaders, setLeaders] = useState<LeadersResponse | null>(null);
  const [isLeadersLoading, setIsLeadersLoading] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const loadSeasons = async () => {
      try {
        setIsSeasonOptionsLoading(true);
        setSeasonOptionsError(null);

        const payload = await apiFetch<LeagueSeasonsResponse>('/leagues/seasons', abortController.signal);
        const options = payload.data ?? [];
        setSeasonOptions(options);

        const activeSeason = options.find((season) => season.is_active);
        const fallbackSeason = options[0]?.id ?? '';
        setSelectedSeasonId((current) => (
          current && options.some((season) => season.id === current)
            ? current
            : (activeSeason?.id ?? fallbackSeason)
        ));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setSeasonOptions([]);
        setSeasonOptionsError((error as Error).message || 'Failed to load season options');
        setSelectedSeasonId('');
      } finally {
        setIsSeasonOptionsLoading(false);
      }
    };

    loadSeasons();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) {
      setAllSeasonLeagues([]);
      setIsLeaguesLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadLeagues = async () => {
      try {
        setIsLeaguesLoading(true);
        setLeaguesError(null);

        const params = new URLSearchParams({ season_id: selectedSeasonId });
        const payload = await apiFetch<LeaguesResponse>(`/leagues?${params.toString()}`, abortController.signal);
        setAllSeasonLeagues(payload.data ?? []);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setAllSeasonLeagues([]);
        setLeaguesError((error as Error).message || 'Failed to load leagues');
      } finally {
        setIsLeaguesLoading(false);
      }
    };

    loadLeagues();
    return () => abortController.abort();
  }, [selectedSeasonId]);

  const visibleLeagues = useMemo(() => {
    if (allSeasonLeagues.length === 0) return [];
    if (selectedLeagueIds.length === 0) return allSeasonLeagues;

    const selected = new Set(selectedLeagueIds);
    const filtered = allSeasonLeagues.filter((league) => selected.has(league.id));
    return filtered.length > 0 ? filtered : allSeasonLeagues;
  }, [allSeasonLeagues, selectedLeagueIds]);

  const selectedLeague = useMemo(
    () => visibleLeagues.find((league) => league.id === selectedLeagueId) ?? null,
    [selectedLeagueId, visibleLeagues],
  );

  useEffect(() => {
    if (visibleLeagues.length === 0) {
      setSelectedLeagueId('');
      setSelectedDivisionId('');
      return;
    }

    const nextLeague = selectedLeague && visibleLeagues.some((league) => league.id === selectedLeague.id)
      ? selectedLeague
      : visibleLeagues[0];

    if (!nextLeague) {
      setSelectedLeagueId('');
      setSelectedDivisionId('');
      return;
    }

    if (selectedLeagueId !== nextLeague.id) {
      setSelectedLeagueId(nextLeague.id);
    }

    const hasSelectedDivision = nextLeague.divisions.some((division) => division.id === selectedDivisionId);
    if (!hasSelectedDivision) {
      setSelectedDivisionId(nextLeague.divisions[0]?.id ?? '');
    }
  }, [selectedDivisionId, selectedLeague, selectedLeagueId, visibleLeagues]);

  useEffect(() => {
    if (view !== 'tables' || !selectedDivisionId) {
      setStandings(null);
      setStandingsError(null);
      setIsStandingsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadStandings = async () => {
      try {
        setIsStandingsLoading(true);
        setStandingsError(null);
        const payload = await apiFetch<StandingsResponse>(
          `/competitions/${selectedDivisionId}/standings`,
          abortController.signal,
        );
        setStandings(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setStandings(null);
        setStandingsError((error as Error).message || 'Failed to load standings');
      } finally {
        setIsStandingsLoading(false);
      }
    };

    loadStandings();
    return () => abortController.abort();
  }, [selectedDivisionId, view]);

  const visibleLeagueIds = useMemo(() => visibleLeagues.map((league) => league.id), [visibleLeagues]);

  useEffect(() => {
    if (view !== 'leaders') {
      setLeaders(null);
      setLeadersError(null);
      setIsLeadersLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadLeaders = async () => {
      try {
        setIsLeadersLoading(true);
        setLeadersError(null);

        const params = new URLSearchParams({
          mode: leadersMode,
          limit: leadersMode === 'win_pct' ? '10' : '20',
          min_played: String(MIN_PLAYED),
        });

        if (selectedSeasonId) {
          params.set('season_id', selectedSeasonId);
        }
        if (visibleLeagueIds.length > 0) {
          params.set('league_ids', visibleLeagueIds.join(','));
        }

        const payload = await apiFetch<LeadersResponse>(`/players/leaders?${params.toString()}`, abortController.signal);
        setLeaders(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setLeaders(null);
        setLeadersError((error as Error).message || 'Failed to load leaderboard');
      } finally {
        setIsLeadersLoading(false);
      }
    };

    loadLeaders();
    return () => abortController.abort();
  }, [leadersMode, selectedSeasonId, view, visibleLeagueIds]);

  const standingsRows = standings?.data ?? [];
  const standingsSourceUrl = standings?.source_url ?? null;

  return (
    <>
      <div className="content mt-n4 mb-3">
        <div className="tt-tab-toolbar">
          <div>
            <p className="font-11 opacity-70 mb-1">League Hub</p>
            <h3 className="mb-0">League Central</h3>
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
        <AppCardContent className="mb-2">
          <label className="font-12 opacity-70 mb-1" htmlFor="league-season-select">Season</label>
          <select
            id="league-season-select"
            className="form-select"
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.currentTarget.value)}
            disabled={isSeasonOptionsLoading || seasonOptions.length === 0}
          >
            {seasonOptions.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}{season.is_active ? ' (Current)' : ''}
              </option>
            ))}
          </select>

          <div className="tt-tab-toggle mt-3">
            <button type="button" className={view === 'tables' ? 'active' : ''} onClick={() => setView('tables')}>
              <i className="fa fa-table me-1" /> Tables
            </button>
            <button type="button" className={view === 'leaders' ? 'active' : ''} onClick={() => setView('leaders')}>
              <i className="fa fa-trophy me-1" /> Leaders
            </button>
          </div>

          {seasonOptionsError ? <p className="mb-0 mt-3 color-red-dark">Failed to load seasons: {seasonOptionsError}</p> : null}
          {leaguesError ? <p className="mb-0 mt-2 color-red-dark">Failed to load leagues: {leaguesError}</p> : null}
          {isLeaguesLoading ? (
            <p className="mb-0 mt-3"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
          ) : null}
          {!isLeaguesLoading && visibleLeagues.length === 0 ? (
            <p className="mb-0 mt-3">No leagues are available for this season.</p>
          ) : null}
        </AppCardContent>
      </AppCard>

      {view === 'tables' && visibleLeagues.length > 0 ? (
        <>
          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <p className="mb-n1 color-highlight font-600">Leagues</p>
              <h4 className="mb-2">Pick League & Division</h4>

              <div className="tt-chip-row">
                {visibleLeagues.map((league) => (
                  <button
                    key={league.id}
                    type="button"
                    className={selectedLeagueId === league.id ? 'tt-chip active' : 'tt-chip'}
                    onClick={() => {
                      setSelectedLeagueId(league.id);
                      setSelectedDivisionId(league.divisions[0]?.id ?? '');
                    }}
                  >
                    {league.name}
                  </button>
                ))}
              </div>

              {!selectedLeague || selectedLeague.divisions.length === 0 ? (
                <p className="mb-0 mt-2">No divisions found for this league.</p>
              ) : (
                <div className="tt-chip-row mt-2">
                  {selectedLeague.divisions.map((division) => (
                    <button
                      key={division.id}
                      type="button"
                      className={selectedDivisionId === division.id ? 'tt-chip active' : 'tt-chip'}
                      onClick={() => setSelectedDivisionId(division.id)}
                    >
                      {division.name}
                    </button>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>

          <AppCard className="mt-2">
            <AppCardContent className="mb-2">
              <div className="d-flex mb-2">
                <div className="align-self-center">
                  <p className="mb-n1 color-highlight font-600">Standings</p>
                  <h4 className="mb-0">League Table</h4>
                </div>
                {standingsSourceUrl ? (
                  <div className="ms-auto align-self-center">
                    <AppButtonLink
                      href={standingsSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="s"
                      tone="outline-highlight"
                    >
                      Source
                    </AppButtonLink>
                  </div>
                ) : null}
              </div>

              {isStandingsLoading ? (
                <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading standings...</p>
              ) : standingsError ? (
                <p className="mb-0 color-red-dark">Failed to load standings: {standingsError}</p>
              ) : standingsRows.length === 0 ? (
                <p className="mb-0">No standings available yet.</p>
              ) : (
                <div className="tt-table-wrap">
                  <table className="tt-standings-table" aria-label="League standings">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standingsRows.map((row) => (
                        <tr key={row.team_id}>
                          <td>{row.position}</td>
                          <td>{row.team_name}</td>
                          <td>{row.won}</td>
                          <td>{row.lost}</td>
                          <td><strong>{row.points}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </>
      ) : null}

      {view === 'leaders' ? (
        <AppCard className="mt-2">
          <AppCardContent className="mb-2">
            <p className="mb-n1 color-highlight font-600">Leaders</p>
            <h4 className="mb-2">Top Players</h4>

            <div className="tt-tab-toggle mb-3">
              <button type="button" className={leadersMode === 'win_pct' ? 'active' : ''} onClick={() => setLeadersMode('win_pct')}>
                Best Win %
              </button>
              <button type="button" className={leadersMode === 'most_played' ? 'active' : ''} onClick={() => setLeadersMode('most_played')}>
                Most Played
              </button>
              <button type="button" className={leadersMode === 'combined' ? 'active' : ''} onClick={() => setLeadersMode('combined')}>
                Combined
              </button>
            </div>

            {isLeadersLoading ? (
              <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leaderboard...</p>
            ) : leadersError ? (
              <p className="mb-0 color-red-dark">Failed to load leaders: {leadersError}</p>
            ) : !leaders || leaders.data.length === 0 ? (
              <p className="mb-0">No leaderboard data available for selected leagues.</p>
            ) : (
              <>
                <p className="font-11 opacity-70 mb-2">{leaders.formula}</p>
                <AppListGroup size="small">
                  {leaders.data.map((row, index) => (
                    <AppListItem
                      key={row.player_id}
                      iconClassName="fa fa-user rounded-xl shadow-xl bg-highlight color-white"
                      title={`${row.rank}. ${row.player_name}`}
                      subtitle={`${row.wins}W-${row.losses}L · ${row.played} played · ${Math.round(row.win_rate)}% WR`}
                      onClick={(event) => {
                        event.preventDefault();
                        onOpenPlayer(row.player_id);
                      }}
                      borderless={index === leaders.data.length - 1}
                    />
                  ))}
                </AppListGroup>
              </>
            )}
          </AppCardContent>
        </AppCard>
      ) : null}
    </>
  );
}
