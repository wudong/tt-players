# Improvements Log

Date started: 2026-03-04  
Scope: New manual QA findings and feature requests from this point forward.  
Rule: Record only (no implementation unless explicitly requested).

## Template
### IMP-XXX - <short title>
Type: Bug | Feature request | UX issue  
Reported behavior: <exact user report>

Quick investigation:
- <what was checked>
- <what was observed>

Issue to address:
- <actionable problem statement>

Status:
- Open

## Items
### IMP-001 - Home "Trending Players" shows empty on first open
Type: Feature request / UX issue  
Reported behavior: When user opens Home page, "Trending Players" list shows nothing; no backend call is triggered.

Quick investigation:
- `HomeView` uses `usePlayerSearch(query)` where initial `query` is empty.
- `usePlayerSearch` is gated by `enabled: normalized.length > 2`, so first page load does not request data.
- Backend `/api/players/search` route contains logic for fallback ordering by `played DESC` when `q` is empty, but current query schema (`q.min(1)`) conflicts with true empty-query requests.

Issue to address:
- Finalize product requirement for first-open Home content.
- Decide canonical behavior:
  - Option A: show "Trending Players" on first load (requires API contract to support no-query request and clear ranking definition).
  - Option B: show an empty/guide state until user types 3+ chars (update heading copy to avoid "Trending" mismatch).
- If Option A is chosen, define exact ranking and tie-breakers (e.g., by matches played in last N days, then win rate, then total wins) and whether this should be cached.

Status:
- Open (requirement decision pending).

### IMP-002 - League selector and league-scoped trending players not implemented
Type: Feature request  
Reported behavior: User should be able to select the set of leagues to view; Trending Players should only come from selected leagues.
Requirement note: User-selected leagues must be saved locally on device/browser only; no server-side preference storage.

Quick investigation:
- Home page shows a filter icon but no selector UI/state is wired to it.
- Leagues selection currently exists only inside `LeaguesHubView` as local component state and is not shared globally.
- `players/search` API has no league/competition filter parameter, so trending/search cannot be scoped by league selection.
- No persisted preference store (URL param/local storage/global context) is connected to Home/H2H queries.

Issue to address:
- Define selection model:
  - league-level vs division-level filtering
  - single-select vs multi-select
  - where selection is managed (global store + local persistence strategy only)
- Extend API contract for player search/trending to accept filter(s) (e.g. `competition_ids[]` or `league_ids[]`).
- Ensure Home trending and player search queries are filtered consistently by the selected scope.
- Persist selected leagues client-side (e.g. localStorage) and restore on app start.
- Keep backend stateless regarding user league preferences.

Status:
- Open (product + API contract definition needed).

### IMP-003 - Player detail lacks full match history and quick H2H action
Type: Feature request / UX issue  
Reported behavior: Player detail only shows recent matches. User cannot see all matches played. For each match row, there should be a quick way to jump to head-to-head between the two players.

Quick investigation:
- Player detail renders `rubbers.slice(0, 5)` in UI, so only 5 rows are visible.
- Player rubbers API (`GET /players/:id/rubbers`) is capped with `LIMIT 20` and currently has no `limit/offset` query params for pagination.
- There is no row-level "H2H" action in `PlayerProfile` match items.
- Backend already has H2H endpoint (`GET /players/:id/h2h/:opponentId`) and frontend route (`/h2h`) exists, so capability exists but is not connected from player match rows.

Issue to address:
- Define "all matches" UX on player page:
  - pagination / infinite scroll / separate "View all" screen
  - desired default page size and sort order
- Extend player rubbers API with pagination metadata (`limit`, `offset`, `total`) for scalable history.
- Add quick H2H affordance on each player match row and define target behavior:
  - deep-link to H2H page prefilled with both players, or
  - inline modal/drawer H2H summary.

Status:
- Open.

### IMP-004 - Player detail missing current-season leagues and teams
Type: Feature request  
Reported behavior: Player details page should also show the leagues and teams that the player is currently playing for in the current season.

Quick investigation:
- Current player endpoints provide stats, extended stats, recent rubbers, and H2H only.
- There is no dedicated player-team membership table; team association is inferred from fixtures/rubbers.
- Team roster endpoint exists by team (`/teams/:id/roster`) but there is no reverse endpoint for player -> teams/leagues.
- Season data includes `seasons.is_active`, but "current season" behavior for multi-league scenarios is not yet codified in player APIs.

Issue to address:
- Define "current season" source of truth for this feature:
  - use `seasons.is_active`, or
  - infer from latest season/fixture dates.
- Add API contract for player affiliations in current season, including:
  - team id + team name
  - league id + league name
  - season id + season name
  - optional competition/division name.
- Add player detail UI section to display these affiliations and handle multi-team/multi-league players.

Status:
- Open.

### IMP-005 - Add "Most Played Opponents" with W/L rate on player detail
Type: Feature request  
Reported behavior: Player detail currently shows Nemesis only; it should also show most played opponents and win/loss rate against them.

Quick investigation:
- Extended player stats endpoint currently returns `nemesis`, `duo`, and `streak` only.
- Backend already computes opponent-level aggregates for nemesis, so similar query logic can produce top opponents by match count.
- Frontend `PlayerProfile` has no section/type model for opponent-frequency list.

Issue to address:
- Define output shape and count:
  - e.g., top 3 or top 5 opponents
  - fields: opponent id/name, played, wins, losses, win rate.
- Extend `/:id/stats/extended` response (or add separate endpoint) to return this list.
- Add UI section on player detail for most played opponents; decide ordering (played desc, then wins desc) and tie-breaking.

Status:
- Open.

### IMP-006 - Improve league/division selector UX on league page (mobile-first)
Type: UX issue  
Reported behavior: On league page, the league/division dropdown controls are not user-friendly and not suitable for mobile.

Quick investigation:
- `LeaguesHubView` currently uses two compact selectors in a 2-column row (`league` and `division`).
- On small screens this creates tight tap targets and limited option visibility/context.
- Current flow also forces sequential selection without clear hierarchy feedback when options are long.

Issue to address:
- Redesign selection interaction for mobile ergonomics:
  - avoid cramped side-by-side controls on narrow screens
  - consider stacked controls, bottom sheet picker, or modal list with larger tap targets.
- Define improved selection behavior:
  - clearer league -> division dependency
  - preserve selection state and reduce accidental resets.
- Keep desktop efficiency while prioritizing mobile usability.

Status:
- Open.

### IMP-007 - Team Hub shows empty roster and no matches for some teams
Type: Bug / data integrity issue  
Reported behavior: Team Hub currently shows no players and no matches.

Quick investigation:
- Verified Team Hub depends on:
  - `GET /api/teams/:id/roster`
  - `GET /api/teams/:id/fixtures`
- Reproduced mixed behavior on production:
  - For several competitions (notably early TableTennis365 divisions tested), teams from standings return `fixtures_total=0` and `roster_len=0`.
  - For TT Leagues competitions tested, same endpoints return non-zero fixtures and roster data.
- This indicates issue is data-coverage or ID-linking consistency by source/competition, not a universal frontend display failure.

Issue to address:
- Investigate ETL/source coverage differences between platforms (TableTennis365 vs TT Leagues) for fixtures/rubbers/team linkage.
- Validate whether standings `team_id` values always map to fixture `home_team_id/away_team_id` for each competition.
- Add UX fallback messaging in Team Hub to distinguish:
  - truly no matches yet
  - data not available for this source/competition.

Status:
- Open.

### IMP-008 - Fixture Results page needs richer fixture context and denser match list
Type: Feature request / UX issue  
Reported behavior: Fixture Results page should show league, division, and played time. Match breakdown should be more compact, remove "Match x" row header, and player names should link to player detail pages.

Quick investigation:
- Frontend `FixtureDetailsView` currently consumes only `GET /fixtures/:id/rubbers`.
- That API returns rubber rows (players + scores) but does not include fixture metadata such as league/division/date-time.
- Current match list card includes a dedicated "Match {index}" strip and uses relatively tall spacing.
- Player names in breakdown are plain text; no navigation is attached to player ids even though ids are available in response.

Issue to address:
- Extend fixture details contract to include fixture-level metadata:
  - league name
  - division/competition name
  - played date-time (not just date)
  - optionally home/away team names for context.
- Redesign match breakdown item density for mobile:
  - remove "Match x" header row
  - tighter vertical spacing and compact score layout.
- Make player names tappable in match rows:
  - singles: both players link to `/players/:playerId`
  - doubles: each listed player should link individually where id exists.

Status:
- Open.

### IMP-009 - League Central should only show user-selected leagues
Type: Feature request  
Reported behavior: League Central should only display leagues selected by the user.

Quick investigation:
- `LeaguesHubView` currently loads all leagues from `/api/leagues` and renders full list in selector.
- No filtering is applied based on user-selected league preferences.
- This is aligned with the broader selection scope work in `IMP-002`, but League Central-specific behavior needs to be explicit.

Issue to address:
- Apply user-selected league filter to League Central data/rendering.
- Define empty-state behavior when user has no selected leagues yet.
- Keep selector/edit flow available so users can update selection from League Central.

Status:
- Open.

### IMP-010 - Leaders tab: aggregated best players for selected leagues with ranking modes
Type: Feature request  
Reported behavior: Leaders should show aggregated best players for user-selected leagues, with tabs for:
1) best winning percentage
2) most played
3) combined score representing "truly best" players.

Quick investigation:
- `LeaguesHubView` currently shows "Leaders coming soon" placeholder.
- No leaderboard API endpoint exists yet for league-scoped aggregated player rankings.
- Current player stats endpoints are per-player and not optimized for leaderboard aggregation + ranking modes.

Issue to address:
- Define leaderboard data scope:
  - aggregate across all user-selected leagues
  - season filter behavior (current season vs all-time).
- Implement ranking modes:
  - Win % leaderboard (with minimum matches threshold to avoid small-sample bias).
  - Most Played leaderboard.
  - Combined ranking formula (e.g., weighted score of win % and volume), with transparent formula.
- Add Leaders UI tabs and shared filtering with user-selected leagues.

Status:
- Open.
