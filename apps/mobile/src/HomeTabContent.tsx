import { useMemo } from 'react';
import type { AppTabId } from './navigation/tab-navigation';
import { type LeagueWithDivisions } from './player-shared';
import { useLeadersQuery } from './queries';
import { AppButtonLink, AppCard, AppCardContent } from './ui/appkit';

type DashboardTabId = Exclude<AppTabId, 'home'>;

interface HomeTabContentProps {
  allLeagues: LeagueWithDivisions[];
  selectedLeagueIds: string[];
  isLeagueSelectionReady: boolean;
  isLeaguesLoading: boolean;
  leaguesError: string | null;
  searchScopeLabel: string;
  onOpenLeagueFilter: () => void;
  onOpenPlayer: (playerId: string) => void;
  onOpenTab: (tabId: DashboardTabId) => void;
}

export function HomeTabContent({
  allLeagues,
  selectedLeagueIds,
  isLeagueSelectionReady,
  isLeaguesLoading,
  leaguesError,
  searchScopeLabel,
  onOpenLeagueFilter,
  onOpenPlayer,
  onOpenTab,
}: HomeTabContentProps) {
  const isAllLeagueScope = selectedLeagueIds.length === 0
    || (allLeagues.length > 0 && selectedLeagueIds.length === allLeagues.length);

  const selectedLeagues = useMemo(() => {
    if (allLeagues.length === 0) return [];
    if (isAllLeagueScope) return allLeagues;

    const selectedLeagueIdSet = new Set(selectedLeagueIds);
    const filtered = allLeagues.filter((league) => selectedLeagueIdSet.has(league.id));
    return filtered.length > 0 ? filtered : allLeagues;
  }, [allLeagues, isAllLeagueScope, selectedLeagueIds]);

  const selectedLeagueCount = selectedLeagues.length;
  const selectedDivisionCount = selectedLeagues.reduce((sum, league) => sum + league.divisions.length, 0);
  const visibleLeagues = selectedLeagues.slice(0, 4);
  const hiddenLeagueCount = Math.max(selectedLeagueCount - visibleLeagues.length, 0);
  const topPlayersLeagueIds = isAllLeagueScope ? [] : selectedLeagueIds;

  const leadersQuery = useLeadersQuery({
    mode: 'combined',
    leagueIds: topPlayersLeagueIds,
    limit: 5,
    minPlayed: 3,
    enabled: isLeagueSelectionReady && !isLeaguesLoading && !leaguesError,
  });

  const topPlayers = leadersQuery.data?.data ?? [];
  const leadersFormula = leadersQuery.data?.formula ?? null;
  const topPlayersError = leadersQuery.error instanceof Error ? leadersQuery.error.message : null;
  const isTopPlayersLoading = leadersQuery.isLoading || (leadersQuery.isFetching && !leadersQuery.data);
  const leaderCountLabel = isTopPlayersLoading ? '...' : String(topPlayers.length);
  const shortcutCards: Array<{
    tabId: DashboardTabId;
    eyebrow: string;
    title: string;
    description: string;
    iconClassName: string;
    meta: string;
  }> = [
    {
      tabId: 'players',
      eyebrow: 'Search and scout',
      title: 'Players',
      description: 'Search the player directory and drill into form, insights and match history across your current scope.',
      iconClassName: 'fa fa-user-friends',
      meta: searchScopeLabel,
    },
    {
      tabId: 'leagues',
      eyebrow: 'Tables and fixtures',
      title: 'Leagues',
      description: 'Browse standings, open team hubs, and inspect fixture breakdowns for the current league scope.',
      iconClassName: 'fa fa-table-tennis',
      meta: `${selectedDivisionCount} division${selectedDivisionCount === 1 ? '' : 's'} in scope`,
    },
    {
      tabId: 'h2h',
      eyebrow: 'Compare rivals',
      title: 'Head to Head',
      description: 'Pick two players and compare their encounters across the leagues you currently care about.',
      iconClassName: 'fa fa-code-compare',
      meta: searchScopeLabel,
    },
  ];

  return (
    <>
      <div className="content mt-3 mb-2">
        <div className="row mb-0">
          <div className="col-4">
            <div className="tt-home-stat-card">
              <p className="tt-home-stat-label mb-1">Leaders</p>
              <h3 className="tt-home-stat-value mb-0">{leaderCountLabel}</h3>
            </div>
          </div>
          <div className="col-4">
            <div className="tt-home-stat-card">
              <p className="tt-home-stat-label mb-1">Leagues</p>
              <h3 className="tt-home-stat-value mb-0">{selectedLeagueCount}</h3>
            </div>
          </div>
          <div className="col-4">
            <div className="tt-home-stat-card">
              <p className="tt-home-stat-label mb-1">Divisions</p>
              <h3 className="tt-home-stat-value mb-0">{selectedDivisionCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <AppCard>
        <AppCardContent className="mb-2">
          <div className="d-flex mb-3">
            <div className="align-self-center">
              <p className="mb-1 color-highlight font-700 text-uppercase font-11">Explore</p>
              <h1 className="mb-0 font-18">What you can do next</h1>
            </div>
          </div>

          <div className="tt-home-shortcuts">
            {shortcutCards.map((card) => (
              <a
                key={card.tabId}
                href="#"
                className="tt-home-shortcut-card"
                onClick={(event) => {
                  event.preventDefault();
                  onOpenTab(card.tabId);
                }}
              >
                <div className="tt-home-shortcut-icon">
                  <i className={card.iconClassName} />
                </div>
                <div className="tt-home-shortcut-copy">
                  <p className="tt-home-shortcut-eyebrow mb-1">{card.eyebrow}</p>
                  <h4 className="mb-1">{card.title}</h4>
                  <p className="mb-2">{card.description}</p>
                  <span className="tt-home-shortcut-meta">{card.meta}</span>
                </div>
                <i className="fa fa-angle-right tt-home-shortcut-arrow" />
              </a>
            ))}
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardContent className="mb-2">
          <div className="d-flex mb-2">
            <div className="align-self-center">
              <p className="mb-1 color-highlight font-700 text-uppercase font-11">Discover</p>
              <h1 className="mb-0 font-18">Top players in scope</h1>
            </div>
            <div className="ms-auto align-self-center">
              <span className="font-11 opacity-60">{searchScopeLabel}</span>
            </div>
          </div>

          {leadersFormula ? (
            <p className="font-11 opacity-60 mt-n1 mb-2">{leadersFormula}</p>
          ) : (
            <p className="font-11 opacity-60 mt-n1 mb-2">Best current performers weighted by win rate and volume.</p>
          )}

          {!isLeagueSelectionReady || isLeaguesLoading ? (
            <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading league scope...</p>
          ) : leaguesError ? (
            <p className="mb-0 color-red-dark">Failed to load leagues: {leaguesError}</p>
          ) : isTopPlayersLoading ? (
            <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading top players...</p>
          ) : topPlayersError ? (
            <p className="mb-0 color-red-dark">Failed to load top players: {topPlayersError}</p>
          ) : topPlayers.length === 0 ? (
            <p className="mb-0">No leaderboard entries are available yet for the selected scope.</p>
          ) : (
            <div className="list-group list-custom-large tt-home-leaders-list">
              {topPlayers.map((player, index) => (
                <a
                  key={player.player_id}
                  href="#"
                  className={index === topPlayers.length - 1 ? 'border-0' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenPlayer(player.player_id);
                  }}
                >
                  <i className="tt-home-rank-badge">{player.rank}</i>
                  <span>{player.player_name}</span>
                  <strong>{player.wins}W-{player.losses}L • {player.played} played • {Math.round(player.win_rate)}% WR</strong>
                  <i className="fa fa-angle-right" />
                </a>
              ))}
            </div>
          )}
        </AppCardContent>
      </AppCard>

      <AppCard className="mb-3">
        <AppCardContent className="mb-2">
          <div className="d-flex mb-2">
            <div className="align-self-center">
              <p className="mb-1 color-highlight font-700 text-uppercase font-11">Scope</p>
              <h1 className="mb-0 font-18">League focus</h1>
            </div>
            <div className="ms-auto align-self-center">
              <span className="font-11 opacity-60">{searchScopeLabel}</span>
            </div>
          </div>

          {!isLeagueSelectionReady || isLeaguesLoading ? (
            <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading your leagues...</p>
          ) : leaguesError ? (
            <p className="mb-3 color-red-dark">Failed to load leagues: {leaguesError}</p>
          ) : (
            <>
              <p className="mb-3">
                Every dashboard card follows this scope. Narrow it down when you want cleaner leaderboards or tighter H2H comparisons.
              </p>
              <div className="tt-home-league-pills">
                {visibleLeagues.map((league) => (
                  <span key={league.id} className="tt-home-league-pill">
                    {league.name}
                  </span>
                ))}
                {hiddenLeagueCount > 0 ? (
                  <span className="tt-home-league-pill tt-home-league-pill-muted">+{hiddenLeagueCount} more</span>
                ) : null}
              </div>
            </>
          )}

          <div className="tt-home-scope-actions">
            <AppButtonLink
              tone="outline-highlight"
              onClick={(event) => {
                event.preventDefault();
                onOpenLeagueFilter();
              }}
            >
              Change Scope
            </AppButtonLink>
            <AppButtonLink
              tone="gray"
              onClick={(event) => {
                event.preventDefault();
                onOpenTab('h2h');
              }}
            >
              Open H2H
            </AppButtonLink>
          </div>
        </AppCardContent>
      </AppCard>
    </>
  );
}
