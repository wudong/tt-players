# Manual Verification Progress Log (2026-03-05)

## Backlog

### MV-001 - League chooser as dedicated full page with search
- Type: improvement
- Priority: high
- Area: League Central, TT Hub, routing
- Status: done
- Notes: Replace modal/overlay with route-based selector; support large lists and consistent trigger button.

### MV-002 - Region-based league selection
- Type: improvement
- Priority: high
- Area: league filter model
- Status: done
- Notes: Region (e.g. Essex) can select multiple leagues; each league can belong to multiple regions.

### MV-003 - Persist league selections in local storage
- Type: improvement
- Priority: medium
- Area: frontend state
- Status: done

### MV-004 - Player page UX improvements
- Type: improvement
- Priority: medium
- Area: player detail page
- Status: done
- Notes: Keep scroll position on "load more"; redesign nemesis/opponents/current season teams sections as cards and reorder sections.

### MV-005 - TT365 match-result scores parsed incorrectly
- Type: issue
- Priority: high
- Area: worker TT365 parser + ingestion
- Status: done
- Notes: Current data suggests 0-1 for all rubbers due to parsing `Score` column instead of per-game `Games` column.

### MV-006 - Home search box should show minimum-character hint
- Type: improvement
- Priority: low
- Area: home page search UI
- Status: done

### MV-007 - Team Hub recent matches shows IDs instead of names/results
- Type: issue
- Priority: high
- Area: Team Hub UI data mapping
- Status: done

### MV-008 - Quick H2H actions from nemesis and most-played-opponents
- Type: improvement
- Priority: medium
- Area: player page cards
- Status: done

### MV-009 - H2H past encounters should include league name
- Type: improvement
- Priority: medium
- Area: head-to-head UI/API payload
- Status: done

### MV-010 - League/Division dropdown visuals inconsistent with app design
- Type: issue
- Priority: medium
- Area: League Central filter controls
- Status: done

### MV-011 - TT Hub trending players description clarity
- Type: improvement
- Priority: low
- Area: TT Hub copy
- Status: done

### MV-012 - Best Win eligibility/ranking rules
- Type: improvement
- Priority: medium
- Area: player analytics query/UI
- Status: done
- Notes: Show top 10 entries when available; ranked by win rate; minimum 3 matches; tie-breakers: played then wins.

### MV-013 - Default selection should be Combined
- Type: improvement
- Priority: low
- Area: analytics filter defaults
- Status: done

## Execution Notes
- 2026-03-05: Repository checkpoint committed (`47e357c`) before continuing task-by-task implementation.
- Policy: commit after each completed MV task.
- 2026-03-05: `MV-005` complete. Updated TT365 parser to derive rubber game counts from `Games` column with fallback to `Score`, updated parser tests, and reprocessed fixture `458455` from raw log `7fc80737-eb27-4b86-bae1-57123a8f46cc`.
- 2026-03-05: `MV-007` complete. `/teams/:id/fixtures` now returns `home_team_name`, `away_team_name`, `home_score`, and `away_score`; Team Hub recent matches now renders readable names and team-perspective result text (e.g. `W 7-3`). Verified with targeted API/web tests and playwright-cli snapshot.
- 2026-03-05: `MV-012` + `MV-013` complete. Leaders default remains `combined`; Best Win mode now requests top 10 rows with min-played=3 and server enforces a minimum 10-slot limit window for `win_pct` mode when available. Verified via targeted tests and playwright-cli (`Leaders` tab showed combined formula by default; `Best Win %` returned 10 rows and the expected ranking formula text).
- 2026-03-05: `MV-004` + `MV-008` + `MV-009` complete. Player profile now keeps scroll position on `Load more matches`, provides quick H2H actions on Nemesis and Most Played Opponents cards, moves Current Season Teams & Leagues below Most Played Opponents, and uses grid-card layouts for both sections. H2H API now returns league + division labels (`League · Division`) for encounters; UI displays it in Past Encounters. Verified with targeted API tests and playwright-cli interaction snapshots.
- 2026-03-05: `MV-001` + `MV-002` + `MV-003` + `MV-006` + `MV-010` + `MV-011` complete. Replaced modal league picker with dedicated `/leagues/select` route shared by TT Hub and League Central, added search + region bulk toggles (including Essex), retained localStorage-backed league preferences, unified both pages on the same filter button pattern, replaced League Central native dropdown selectors with app-consistent league/division button chips, added home-page search guidance (`type at least 3 characters`), and added a clear trending-list logic description. Verified with web type-check, targeted tests, and playwright-cli navigation snapshots.
