# UI Testing Report: Table Tennis Aggregator

This report documents the UI testing of the Table Tennis Aggregator MVP using Playwright.

## 1. Functionalities Tested

The following core views and features were tested:

*   **Home View**: Player search and trending players list.
*   **Player Profile**: Detailed statistics, win rate, and recent match history.
*   **Fixture Details**: Individual rubber results for a specific fixture.
*   **Leagues Hub**: League and division selectors, and the standings table.
*   **H2H View**: Comparative statistics between two selected players.

## 2. Testing Methodology

1.  **Environment Setup**:
    *   PostgreSQL database started via Docker Compose.
    *   Database seeded with a realistic dataset (Alice Johnson, Bob Smith, George Lucas, etc.).
    *   API and Web Application started locally.
2.  **Execution**:
    *   Used `playwright-cli` to navigate through the application.
    *   Verified data rendering and interactive elements (links, buttons, selectors).
    *   Captured screenshots and snapshots at key interaction points.

## 3. Test Evidence

### 3.1 Home View & Search
The home page correctly displays the search box and trending players. Searching for "Alice" correctly filters the list.

| Home View | Search Results |
| :---: | :---: |
| ![Home View](home-view.png) | ![Search Results](search-results.png) |

### 3.2 Player Profile
Clicking on a player (Alice Johnson) opens their detailed profile with stats and recent matches.

![Player Profile](player-profile.png)

### 3.3 Fixture Details
Clicking a match in the player's recent history opens the fixture details view showing individual rubbers.

![Fixture Details](fixture-details.png)

### 3.4 Leagues Hub
The Leagues Hub allows switching between different leagues and divisions. Selecting "Brentwood & District TTL" -> "Premier Division" shows the standings.

| Leagues Hub | Brentwood Premier Division |
| :---: | :---: |
| ![Leagues Hub](leagues-hub.png) | ![Brentwood Prem](leagues-brentwood-prem.png) |

### 3.5 Head-to-Head (H2H)
The H2H view allows comparing two players. Selecting Alice Johnson and George Lucas shows their win/loss balance and overall win rates.

![H2H Selected](h2h-selected.png)

## 4. Observations & Issues Found

| Issue | Description | Status |
| :--- | :--- | :--- |
| **Missing Linkage** | Clicking on a Team name in the League Table does not open the Team Hub (missing `onClick` handler). | 🔴 Bug |
| **H2H Layout** | The Player B search box overlaps the Player A search results dropdown due to z-index stacking. | 🔴 Bug |
| **Match Center** | The "Match of the Week" feature mentioned in the design docs is not yet implemented. | 🟡 Missing Feature |
| **Empty Search** | The API returns a 400 error for empty search queries (`q=`), which is logged in the console. | 🟡 Minor |

## 5. Conclusion
The application provides a smooth mobile-first experience with a clean, modern aesthetic. Core flows for players, fixtures, and leagues are functional, though some entity linkages and layout refinements are still needed to reach full MVP specification.
