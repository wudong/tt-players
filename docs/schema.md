# **Table Tennis Aggregator App \- Database Schema**

This document outlines the relational database schema designed to aggregate data from multiple UK table tennis league platforms (e.g., TT Leagues, TableTennis365). It is optimized for ETL (Extract, Transform, Load) processes, handles complex amateur sports edge cases (walkovers, handicap cups, individual tournaments), and prevents data duplication.

## **Enum Types**

These are defined as PostgreSQL `CREATE TYPE` enums.

| Enum Name | Values |
| :---- | :---- |
| competition\_type | `league`, `team_cup`, `individual` |
| fixture\_status | `upcoming`, `completed`, `postponed` |
| outcome\_type | `normal`, `walkover`, `retired`, `void` |
| scrape\_status | `pending`, `processed`, `failed` |

## **1\. Core Application & Users**

These tables manage the actual humans logging into your app and linking their various web profiles. **Deferred to Wave 7 (Auth is out of scope for MVP).**

### **users**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key | Unique app user ID. |
| email | String | Unique | User's login email. |
| password\_hash | String |  | Hashed password. |
| display\_name | String |  | How the user is greeted in the app. |
| created\_at | Timestamp | Default: Now() | Account creation date. |
| updated\_at | Timestamp | Default: Now() | Last update timestamp. |

### **user\_linked\_profiles**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| user\_id | UUID | FK \-> users(id) | The app user. |
| external\_player\_id | UUID | FK \-> external\_players(id) | The scraped profile from the target website. |
| created\_at | Timestamp | Default: Now() |  |

**Unique constraint:** `UNIQUE(user_id, external_player_id)` — prevents duplicate links.

## **2\. Organization Hierarchy (The League Structure)**

These tables map the structure of the data scraped from the websites. All scraped tables include `external_id` for deduplication and `deleted_at` for soft deletes (to retain historical data if a league removes a team/season).

### **platforms**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| name | String |  | e.g., "TT Leagues", "TableTennis365" |
| base\_url | String |  | e.g., "https://brentwood.ttleagues.com" |
| created\_at | Timestamp | Default: Now() |  |

### **leagues**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| platform\_id | UUID | FK \-> platforms(id) | Which site hosts this league. |
| external\_id | String |  | The ID used by the platform. |
| name | String |  | e.g., "Brentwood & District League" |
| created\_at | Timestamp | Default: Now() |  |
| deleted\_at | Timestamp | Nullable | Soft delete flag. |

**Unique constraint:** `UNIQUE(platform_id, external_id)` — for UPSERT deduplication.

### **seasons**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| league\_id | UUID | FK \-> leagues(id) |  |
| external\_id | String |  |  |
| name | String |  | e.g., "Winter 2025/2026" |
| is\_active | Boolean | Default: False | Tells the app which season to default to. |
| created\_at | Timestamp | Default: Now() |  |
| deleted\_at | Timestamp | Nullable |  |

**Unique constraint:** `UNIQUE(league_id, external_id)` — for UPSERT deduplication.

### **competitions (Replaces 'Divisions' to support cups/tournaments)**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| season\_id | UUID | FK \-> seasons(id) |  |
| external\_id | String |  |  |
| name | String |  | e.g., "Division 1", "Handicap Cup" |
| type | competition\_type |  | league, team\_cup, individual |
| last\_scraped\_at | Timestamp |  | **Crucial:** Used to throttle scrapers. |
| created\_at | Timestamp | Default: Now() |  |
| deleted\_at | Timestamp | Nullable |  |

**Unique constraint:** `UNIQUE(season_id, external_id)` — for UPSERT deduplication.

### **teams**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| competition\_id | UUID | FK \-> competitions(id) |  |
| external\_id | String |  |  |
| name | String |  | e.g., "Hutton A" |
| created\_at | Timestamp | Default: Now() |  |
| deleted\_at | Timestamp | Nullable | Handles teams folding mid-season. |

**Unique constraint:** `UNIQUE(competition_id, external_id)` — for UPSERT deduplication.

## **3\. Players & Caching**

### **external\_players**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| platform\_id | UUID | FK \-> platforms(id) |  |
| external\_id | String | Nullable | Nullable for unregistered reserve players. |
| name | String |  | e.g., "John Smith" |
| created\_at | Timestamp | Default: Now() |  |
| updated\_at | Timestamp |  | Last time this name/profile was updated. |
| deleted\_at | Timestamp | Nullable | Soft delete flag. |

**Unique constraint:** `UNIQUE(platform_id, external_id) WHERE external_id IS NOT NULL` — partial unique index. NULL `external_id` rows (unregistered reserves) are not constrained.

### **league\_standings (Calculated by the league, scraped by you)**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| competition\_id | UUID | FK \-> competitions(id) |  |
| team\_id | UUID | FK \-> teams(id) |  |
| position | Integer |  | League position (1st, 2nd, etc.) |
| played | Integer |  |  |
| won | Integer |  |  |
| drawn | Integer |  |  |
| lost | Integer |  |  |
| points | Integer |  | Total points (includes official penalties). |
| created\_at | Timestamp | Default: Now() |  |
| updated\_at | Timestamp |  |  |
| deleted\_at | Timestamp | Nullable |  |

**Unique constraint:** `UNIQUE(competition_id, team_id)` — one standing row per team per competition.

## **4\. Match Data (Fixtures & Rubbers)**

### **fixtures (The overall Team vs Team, or Tournament Round)**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| competition\_id | UUID | FK \-> competitions(id) |  |
| external\_id | String |  |  |
| home\_team\_id | UUID | FK, Nullable | Null if it's an Individual Tournament. |
| away\_team\_id | UUID | FK, Nullable | Null if it's an Individual Tournament. |
| date\_played | Date |  |  |
| status | fixture\_status |  | upcoming, completed, postponed |
| round\_name | String | Nullable | e.g., "Semi-Final". For cups/tournaments. |
| round\_order | Integer | Nullable | e.g., 4\. Used for rendering UI brackets. |
| created\_at | Timestamp | Default: Now() |  |
| updated\_at | Timestamp |  |  |
| deleted\_at | Timestamp | Nullable |  |

**Unique constraint:** `UNIQUE(competition_id, external_id)` — for UPSERT deduplication.

### **rubbers (The actual 1v1 or 2v2 matches)**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key |  |
| fixture\_id | UUID | FK \-> fixtures(id) |  |
| external\_id | String |  |  |
| is\_doubles | Boolean | Default: False | Determines if player\_2 columns are used. |
| home\_player\_1\_id | UUID | FK \-> external\_players(id) |  |
| home\_player\_2\_id | UUID | FK, Nullable | Used for doubles only. |
| away\_player\_1\_id | UUID | FK \-> external\_players(id) |  |
| away\_player\_2\_id | UUID | FK, Nullable | Used for doubles only. |
| home\_games\_won | Integer |  | e.g., 3 |
| away\_games\_won | Integer |  | e.g., 1 |
| home\_points\_scored | Integer | Nullable | For handicap cup/total points formats. |
| away\_points\_scored | Integer | Nullable | For handicap cup/total points formats. |
| outcome\_type | outcome\_type |  | normal, walkover, retired, void. Prevents W/O from skewing player averages. |
| created\_at | Timestamp | Default: Now() |  |
| updated\_at | Timestamp |  |  |
| deleted\_at | Timestamp | Nullable |  |

**Unique constraint:** `UNIQUE(fixture_id, external_id)` — for UPSERT deduplication.

## **5\. ETL & Staging Pipeline**

This table is completely isolated from the main relational schema. It acts as the landing zone for the raw data pulled by the web scrapers before it is processed by the backend workers.

### **raw\_scrape\_logs**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | Primary Key | Unique log identifier. |
| platform\_id | UUID | FK \-> platforms(id) | Which site this data came from. |
| endpoint\_url | String |  | The exact URL that was scraped. |
| raw\_payload | Text |  | The raw HTML or JSON response body. TEXT chosen over JSONB to accommodate both HTML (TT365) and JSON (TT Leagues) payloads. |
| payload\_hash | String | Indexed | SHA256 hash of the raw\_payload. Used to detect if data has changed. |
| scraped\_at | Timestamp | Default: Now() | The exact time the scraper fetched the data. |
| status | scrape\_status |  | pending, processed, failed. Used by the Message Queue worker. |

**Unique constraint:** `UNIQUE(endpoint_url, payload_hash)` — enables SQL UPSERT for deduplication. If the same URL returns the same data (same hash), the existing row's `scraped_at` is updated instead of creating a duplicate. Different URLs with the same hash are allowed (each gets its own row).
