# Manual Verification Progress Log (2026-03-05)

## Backlog

### MV-001 - League chooser as dedicated full page with search
- Type: improvement
- Priority: high
- Area: League Central, TT Hub, routing
- Status: pending
- Notes: Replace modal/overlay with route-based selector; support large lists and consistent trigger button.

### MV-002 - Region-based league selection
- Type: improvement
- Priority: high
- Area: league filter model
- Status: pending
- Notes: Region (e.g. Essex) can select multiple leagues; each league can belong to multiple regions.

### MV-003 - Persist league selections in local storage
- Type: improvement
- Priority: medium
- Area: frontend state
- Status: pending

### MV-004 - Player page UX improvements
- Type: improvement
- Priority: medium
- Area: player detail page
- Status: pending
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
- Status: pending

### MV-007 - Team Hub recent matches shows IDs instead of names/results
- Type: issue
- Priority: high
- Area: Team Hub UI data mapping
- Status: done

### MV-008 - Quick H2H actions from nemesis and most-played-opponents
- Type: improvement
- Priority: medium
- Area: player page cards
- Status: pending

### MV-009 - H2H past encounters should include league name
- Type: improvement
- Priority: medium
- Area: head-to-head UI/API payload
- Status: pending

### MV-010 - League/Division dropdown visuals inconsistent with app design
- Type: issue
- Priority: medium
- Area: League Central filter controls
- Status: pending

### MV-011 - TT Hub trending players description clarity
- Type: improvement
- Priority: low
- Area: TT Hub copy
- Status: pending

### MV-012 - Best Win eligibility/ranking rules
- Type: improvement
- Priority: medium
- Area: player analytics query/UI
- Status: pending
- Notes: Minimum 10 matches to appear; ranked by win rate; minimum 3 wins; tie-breakers: played then wins.

### MV-013 - Default selection should be Combined
- Type: improvement
- Priority: low
- Area: analytics filter defaults
- Status: pending

## Execution Notes
- 2026-03-05: Repository checkpoint committed (`47e357c`) before continuing task-by-task implementation.
- Policy: commit after each completed MV task.
- 2026-03-05: `MV-005` complete. Updated TT365 parser to derive rubber game counts from `Games` column with fallback to `Score`, updated parser tests, and reprocessed fixture `458455` from raw log `7fc80737-eb27-4b86-bae1-57123a8f46cc`.
- 2026-03-05: `MV-007` complete. `/teams/:id/fixtures` now returns `home_team_name`, `away_team_name`, `home_score`, and `away_score`; Team Hub recent matches now renders readable names and team-perspective result text (e.g. `W 7-3`). Verified with targeted API/web tests and playwright-cli snapshot.
