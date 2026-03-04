# Extractor Design: TT Leagues

This document outlines the design for the TT Leagues data extractor, identified during the analysis of the Brentwood TT Leagues website.

## Target Platform
- **Name:** TT Leagues
- **Base Website:** `https://[league-name].ttleagues.com`
- **Base API URL:** `https://ttleagues-api.azurewebsites.net/api/`

## Identified API Endpoints

### 1. League Standings
- **Endpoint:** `divisions/[DIVISION_ID]/standings`
- **Alternative:** `divisions/standings/published?competitionId=[COMPETITION_ID]&divisionId=[DIVISION_ID]`
- **Method:** `GET`
- **Deduplication Key:** `entrantId` or `teamId`.

**Response Shape** — flat array of standing objects:

```json
[
  {
    "entrantId": 13724,
    "teamId": 13902,
    "fullName": "Billericay A",
    "name": "Billericay A",
    "position": 1,
    "played": 1,
    "won": 1,
    "drawn": 0,
    "lost": 0,
    "setsFor": 9,
    "setsAgainst": 1,
    "gamesFor": 29,
    "gamesAgainst": 11,
    "gamePointsFor": 0,
    "gamePointsAgainst": 0,
    "adjustment": 0,
    "pointsAgainst": 0,
    "points": 9,
    "competitionId": 613
  }
]
```

### 2. Division Matches (Fixtures)
- **Endpoint:** `divisions/[DIVISION_ID]/matches`
- **Method:** `GET`
- **Deduplication Key:** `id` (the match ID).

**Response Shape** — object with `groups` (by week) and flat `matches` array:

```json
{
  "groups": [
    {
      "type": 1,
      "date": "2019-09-16T12:00:00Z",
      "week": 1,
      "title": "",
      "range": 1,
      "matches": [
        {
          "id": 220789,
          "date": "2019-09-16T11:00:00Z",
          "time": null,
          "week": 1,
          "name": "Premier Division",
          "venue": "",
          "competitionId": 613,
          "divisionId": 1632,
          "leagueId": 25,
          "hasResults": true,
          "manual": true,
          "forfeit": null,
          "abandoned": null,
          "round": null,
          "home": {
            "id": 13724,
            "teamId": 13902,
            "name": "Billericay A",
            "displayName": "Billericay A",
            "score": 9,
            "clubId": 211,
            "userId": "",
            "members": [],
            "reserves": [],
            "type": 1,
            "points": null
          },
          "away": {
            "id": 13726,
            "teamId": 13904,
            "name": "Billericay C",
            "displayName": "Billericay C",
            "score": 1,
            "clubId": 211,
            "userId": "",
            "members": [],
            "reserves": [],
            "type": 1,
            "points": null
          }
        }
      ]
    }
  ],
  "matches": [ /* flat list of all matches (same shape as above) */ ]
}
```

**Key fields on a match object:** `id`, `date`, `competitionId`, `divisionId`, `leagueId`, `hasResults`, `forfeit`, `abandoned`, `round`, and nested `home`/`away` with `id` (entrantId), `teamId`, `name`, `score`.

### 3. Match Details
- **Endpoint:** `matches/[MATCH_ID]`
- **Method:** `GET`
- **Data Provided:** Same shape as individual match objects in the matches array above, with full details (date, venue, team scores).

### 4. Rubber Details (Sets)
- **Endpoint:** `matches/[MATCH_ID]/sets`
- **Method:** `GET`
- **Deduplication Key:** `id` (the set ID).

**Response Shape** — flat array of set (rubber) objects:

```json
[
  {
    "id": 2302214,
    "matchId": 220789,
    "scores": "",
    "homeScore": 3,
    "awayScore": 0,
    "ordering": 0,
    "fixed": true,
    "completed": "2020-02-28T13:19:45.597Z",
    "locked": false,
    "homeId": 13724,
    "awayId": 13726,
    "homePlayers": [
      {
        "entrantId": 13724,
        "userId": "d70db6fb-82ea-4a12-9fc9-326796cc992b",
        "name": "Gary Ward",
        "playerId": 2341249,
        "ordering": 0,
        "type": 1,
        "forfeit": null
      }
    ],
    "awayPlayers": [
      {
        "entrantId": 13726,
        "userId": "d0c6fe6a-2051-47d8-8b80-f16aa8072dd4",
        "name": "Sam Thompson",
        "playerId": 2341252,
        "ordering": 1,
        "type": 1,
        "forfeit": null
      }
    ],
    "games": [
      { "id": 11180011, "home": 11, "away": 2, "ordering": 0 },
      { "id": 11180012, "home": 11, "away": 7, "ordering": 1 },
      { "id": 11180013, "home": 16, "away": 14, "ordering": 2 },
      { "id": 11180014, "home": null, "away": null, "ordering": 3 },
      { "id": 11180015, "home": null, "away": null, "ordering": 4 }
    ]
  }
]
```

**Detecting doubles:** Check `homePlayers.length > 1`. In the sample data, the last set (ordering 9) has 2 home and 2 away players — this is the doubles rubber. Singles `type` is `1`, doubles `type` is `2`.

**Detecting walkovers:** Check `forfeit` on the player object (non-null = walkover/scratch).

## Extraction Strategy (Wave 2)

### Phase 1: Raw Data Collection
1. **Input:** A list of Division IDs to scrape.
2. **Action:**
    - Fetch Standings JSON.
    - Fetch Matches JSON.
    - For each match where `hasResults === true`, fetch the Match Sets JSON.
3. **Storage:**
    - Each JSON response is hashed (SHA256).
    - Store in `raw_scrape_logs` with `endpoint_url`, `raw_payload`, and `payload_hash`.
    - Use `ON CONFLICT (endpoint_url, payload_hash) DO UPDATE SET scraped_at = NOW()`.

### Phase 2: Transformation (Wave 3)
1. **Zod Validation:** Define schemas matching the JSON shapes documented above.
2. **Mapping:**
    - **Teams:** Extract from Standings (`teamId`, `name`) and Match `home`/`away` objects.
    - **Players:** Extract from Sets `homePlayers`/`awayPlayers` (using `userId` as `external_id`).
    - **Fixtures:** Map from Division Matches (`id` → `external_id`, `date` → `date_played`, derive `status` from `hasResults`/`forfeit`/`abandoned`).
    - **Rubbers:** Map from Sets (`id` → `external_id`, `homeScore`/`awayScore` → `home_games_won`/`away_games_won`, detect doubles via player count, detect walkovers via `forfeit`).
    - **League Standings:** Map from Standings (`position`, `played`, `won`, `drawn`, `lost`, `points`).

## Sample Extraction URLs for Brentwood Premier Division
- **Competition ID:** 613
- **Division ID:** 1632
- **Standings:** `https://ttleagues-api.azurewebsites.net/api/divisions/1632/standings`
- **Matches:** `https://ttleagues-api.azurewebsites.net/api/divisions/1632/matches`
- **Match Sets:** `https://ttleagues-api.azurewebsites.net/api/matches/220789/sets`

## Notes on TT Leagues API
- The API is a multi-tenant Azure web app. No authentication required for public endpoints.
- Most requests accept a `_=[TIMESTAMP]` cache-busting query parameter.
- Completed matches have `hasResults: true` and non-null `submitted`/`approved` timestamps.
- The `score` field on `home`/`away` objects is `null` for matches without results.
- Cup/bye weeks appear as groups with `type: 4` and an empty `matches` array.
