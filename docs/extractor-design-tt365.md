# Extractor Design: TableTennis365 (TT365)

This document outlines the design for the TableTennis365 data extractor, identified during the analysis of the Brentwood TableTennis365 website.

## Target Platform
- **Name:** TableTennis365
- **Base Website:** `https://www.tabletennis365.com/[LeagueName]`
- **Example:** `https://www.tabletennis365.com/Brentwood`

## Extraction Method
Unlike TT Leagues, TT365 does not expose a public JSON API. The extractor must use **HTML Parsing (Cheerio)** to scrape data from the server-rendered pages.

## Key Target URLs

### 1. League Standings
- **URL Pattern:** `/[LeagueName]/Tables/[Season]/[Division]`
- **Example:** `/Brentwood/Tables/Winter_2025/Premier_Division`
- **Selectors:**
    - Table: `table` (usually the first one, or the one containing "Team" in header).
    - Rows: `tbody tr`.
    - Columns: 
        1. `#` (Position)
        2. `Team` (contains `<a>` with `external_id` in URL)
        3. `P` (Played)
        4. `W` (Won)
        5. `D` (Drawn)
        6. `L` (Lost)
        7. `SF` (Sets For)
        8. `SA` (Sets Against)
        9. `Points`

### 2. Fixtures & Results
- **URL Pattern:** `/[LeagueName]/Fixtures/[Season]/[Division]`
- **Example:** `/Brentwood/Fixtures/Winter_2025/Premier_Division`
- **Selectors:**
    - Match Rows: Find elements that look like match entries (often div-based or table-based depending on view).
    - Match ID: Extracted from the "Match Card" link.
    - Status: Check if a score exists to determine if it's `completed` or `upcoming`.

### 3. Match Card (Rubbers)
- **URL Pattern:** `/[LeagueName]/Results/[Season]/[Division]/MatchCard/[MatchID]`
- **Example:** `/Brentwood/Results/Winter_2025/Premier_Division/MatchCard/458829`
- **Selectors:**
    - Main Table: `table` containing rubber results.
    - Rubber Row Structure:
        - `Home Player`: First column (contains `<a>` with player ID).
        - `Away Player`: Second column (contains `<a>` with player ID).
        - `Games`: Third column (contains game scores like `11-4, 11-13...`).
        - `Score`: Fourth column (set score like `1-0` or `0-1`).
    - Doubles: Detected if a cell contains two `<a>` tags or two names separated by a newline/break.

## Extraction Strategy (Wave 7)

### Phase 1: Raw Data Collection
1. **Input:** List of Division URLs.
2. **Action:**
    - Fetch Standings HTML.
    - Fetch Fixtures HTML.
    - For each `completed` match, fetch the Match Card HTML.
3. **Storage:**
    - Hash the raw HTML payload (SHA256).
    - Store in `raw_scrape_logs` with `status = 'pending'`.
    - Handle deduplication via `payload_hash`.

### Phase 2: Transformation
1. **Parsing:** Use **Cheerio** to load the `raw_payload`.
2. **Mapping:**
    - **External Players:** Extract from Match Card. Use the URL part (e.g., `/Brentwood/Players/Statistics/.../John_Smith`) or a unique ID if visible in links.
    - **Teams:** Extract from Standings or Match Card.
    - **Fixtures:** Extract from Fixtures list or Match Card header.
    - **Rubbers:** Parse the Match Card table rows.
3. **UPSERTs:** Run Kysely transactions to update the relational database.

## Challenges & Considerations
- **Dynamic Content:** Some parts of TT365 might use JS to render, though the core tables are usually in the initial HTML. If `fetch` fails to get the table, Playwright might be needed for the Phase 1 worker (though `fetch` is preferred for speed).
- **Player IDs:** TT365 often uses name-based slugs in URLs (e.g., `John_Smith`). The extractor must handle these consistently as `external_id`.
- **Forfeits/Walkovers:** These are explicitly mentioned in the Match Card (e.g., "Forfeit") and must be mapped to `outcome_type = 'walkover'`.
