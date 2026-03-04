# Improvements Implementation Task List

Date started: 2026-03-04
Source: `docs/improvements-log.md`
Verification rule: Each IMP item must pass Playwright validation before moving to the next.

## IMP-001 - Home Trending Players loads on first open
Status: Completed
- [x] Backend `/api/players/search` accepts empty query (`q` optional/blank)
- [x] Backend default ranking for empty query is stable and documented in code (played desc, wins desc, name asc)
- [x] Frontend requests trending players on first home load
- [x] Frontend empty-state copy distinguishes trending vs search
- [x] Playwright check: Home opens with populated Trending list and no typing required

## IMP-002 - League selector + league-scoped trending/search
Status: Completed
- [x] Add client-side league preference store with local persistence (`localStorage`)
- [x] Add Home filter UI to select leagues (multi-select)
- [x] Extend player search/trending API contract to accept league filters
- [x] Apply selected league filter to Home trending/search requests
- [x] Restore selected leagues on app start
- [x] Playwright check: changing selected leagues changes Home results and persists after reload

## IMP-003 - Player full match history + quick H2H action
Status: Completed
- [x] Add pagination to `GET /players/:id/rubbers` (`limit`, `offset`, `total`)
- [x] Update player page to show paginated history (load more)
- [x] Add row-level quick H2H action from match list
- [x] Connect quick H2H action to prefilled H2H view
- [x] Playwright check: can load more history and open H2H directly from a match row

## IMP-004 - Player current-season leagues and teams
Status: Completed
- [x] Add API endpoint for player current-season affiliations (league/division/team/season)
- [x] Define and implement current-season source (`seasons.is_active = true`)
- [x] Render affiliations section in Player detail
- [x] Playwright check: player page shows current-season affiliations when data exists

## IMP-005 - Most Played Opponents section on player detail
Status: Completed
- [x] Extend player extended-stats response with top opponents list
- [x] Include fields: opponent id/name, played, wins, losses, win rate
- [x] Add UI section to Player detail
- [x] Playwright check: section renders and lists opponents ordered by played desc

## IMP-006 - Mobile-first league/division selector UX
Status: Completed
- [x] Replace cramped side-by-side selectors with mobile-friendly flow (stacked + picker)
- [x] Preserve clear league -> division dependency
- [x] Preserve user selection across tab switches
- [x] Playwright check: selector interaction is usable on mobile viewport

## IMP-007 - Team Hub empty roster/matches handling
Status: Completed
- [x] Add backend data-availability signal for team roster/fixtures empty states
- [x] Distinguish “no matches yet” vs “source data unavailable/incomplete”
- [x] Add explicit fallback UI messaging in Team Hub and fixtures feed
- [x] Playwright check: empty states display correct reason messaging

## IMP-008 - Fixture Results richer context + denser list
Status: Completed
- [x] Extend fixture rubbers API to include fixture metadata (league/division/played datetime/team names)
- [x] Redesign match list rows to remove `Match x` header and reduce vertical density
- [x] Make each player name in singles/doubles rows link to player profile
- [x] Playwright check: fixture page shows context metadata and player links navigate correctly

## IMP-009 - League Central only shows selected leagues
Status: Completed
- [x] Filter League Central data by selected league preferences
- [x] Add empty state when no leagues selected
- [x] Keep an in-page edit flow to change selected leagues
- [x] Playwright check: only selected leagues are shown in League Central selectors/content

## IMP-010 - Leaders tab with ranking modes
Status: Completed
- [x] Add leaderboard API endpoint scoped by selected leagues
- [x] Implement ranking modes: win %, most played, combined score
- [x] Implement transparent combined formula and threshold logic
- [x] Build Leaders tab UI with mode switching
- [x] Playwright check: tabs load ranked players and reflect selected league scope
