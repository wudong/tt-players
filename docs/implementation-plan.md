# **Implementation Plan: Table Tennis Aggregator**

This document breaks down the development of the Table Tennis Aggregator into 7 distinct waves. Each wave has a clear "Definition of Done" and an explicit "Verification Strategy" so we can test and validate the system incrementally using a Test-Driven Development (TDD) approach.

**🤖 THE GOLDEN RULE FOR AI AGENTS:** \> For any wave marked as "Agent Verifiable", the LLM must write the Vitest test suite to verify the requirements *before* writing the implementation code. Show the tests to the developer for approval, and only then write the code to make those tests pass.

## **Wave 1: The Foundation (Monorepo & Database)**

*Goal: Set up the project structure, spin up the database, and translate our schema into code.*

1. **Initialize Monorepo:** Set up a pnpm workspace with three internal packages: `apps/api` (Fastify), `apps/worker` (Graphile), and `packages/db` (Shared database code).
2. **Setup PostgreSQL:** Spin up a local Postgres 15 instance using Docker (`docker-compose.yml` at root).
3. **Configure Kysely:** Install Kysely with the `pg` dialect in `packages/db`. Set up the connection pool. Configure `dotenv` for loading `DATABASE_URL` from `.env`.
4. **Write Migrations:** Translate `schema.md` into Kysely TypeScript migration files:
   * *Step 0:* Create PostgreSQL enum types (`competition_type`, `fixture_status`, `outcome_type`, `scrape_status`).
   * *Step 1:* Create core tables (`platforms`, `leagues`, `seasons`, `competitions`, `teams`) with all unique constraints.
   * *Step 2:* Create match tables (`external_players`, `fixtures`, `rubbers`, `league_standings`) with all unique constraints and partial indexes.
   * *Step 3:* Create the ETL staging table (`raw_scrape_logs`) with the `UNIQUE(endpoint_url, payload_hash)` constraint.
5. **Generate Types:** Export the generated TypeScript interfaces from Kysely so the API and Workers can use them.
6. **Define Scripts:** Add `pnpm db:migrate` and `pnpm db:migrate:down` scripts to `packages/db/package.json`.
* **Verification Strategy:** 🟢 **100% Agent Verifiable.** Agent must write a Vitest suite that:
  1. Spins up a test database (using the Docker Postgres instance with a separate test DB name)
  2. Runs all migrations against it
  3. Queries `information_schema` to assert all tables and columns exist with correct data types
  4. Verifies all unique constraints exist
  5. Tears down the test database after the run
* **Definition of Done:** `pnpm db:migrate` runs successfully, TypeScript infers table shapes, and the database test suite passes.

## **Wave 2: Target Analysis & The Extract Pipeline (Phase 1 ETL)**

*Goal: Successfully pull raw data from a single source and save it to the staging table.*

1. **Playwright Analysis:** Use Playwright CLI manually to inspect a TT Leagues division page. Find the hidden JSON API endpoint that returns the league table or match results.
2. **Build the Extractor:** In `apps/worker`, write an extraction script using native `fetch` (Node 18+) to hit the TT Leagues JSON endpoint.
3. **Implement Hashing:** Add the Node crypto logic to generate a SHA256 hash of the response body.
4. **Save Raw Data:** Use Kysely to INSERT the payload, hash, and target URL into `raw_scrape_logs`. Use the `UNIQUE(endpoint_url, payload_hash)` constraint for UPSERT: if the same URL returns the same data, update `scraped_at` instead of creating a duplicate row.
5. **Error Handling:** Handle HTTP errors (403, 500, DNS failures) gracefully — log the error and let Graphile Worker retry.
* **Verification Strategy:** 🟡 **Hybrid.**
  * *Human:* Provide a valid target URL and sample JSON using manual Playwright inspection.
  * *Agent:* Write Vitest tests mocking `fetch`. Test two scenarios: (1) A new URL+hash inserts a new row. (2) An identical URL+hash triggers an `scraped_at` update, not a new row. (3) A different URL with the same hash inserts a separate row (both valid).
* **Definition of Done:** Extract script runs, populates exactly one row in `raw_scrape_logs` with valid JSON, and subsequent runs of the same URL only update `scraped_at` if the hash matches.

## **Wave 3: The Transform & Load Pipeline (Phase 2 ETL)**

*Goal: Parse the raw JSON and populate the complex relational database tables.*

1. **Zod Schemas:** Write Zod schemas matching the exact shape of the TT Leagues JSON response found in Wave 2.
2. **Build the Parser:** Write a function that reads the `raw_payload` from the database and validates it against the Zod schema.
3. **Implement UPSERTs (in a single transaction):** Write the Kysely logic to `INSERT ... ON CONFLICT DO UPDATE` for:
   * Teams
   * External Players
   * Fixtures
   * Rubbers
   * League Standings
   All UPSERTs are wrapped in a single `db.transaction()`. If any fails, the entire batch rolls back.
4. **Mark as Processed:** Update the `raw_scrape_logs` row status to `processed` on success, or `failed` on error.
* **Verification Strategy:** 🟢 **100% Agent Verifiable.** Agent must use a saved `mock_tt_leagues_response.json` file to write a Vitest suite. Tests run against a **test Postgres database** (not in-memory) and must assert:
  1. Feeding mock JSON through the parser results in the exact correct number of rows in the `fixtures`, `rubbers`, `league_standings`, and `teams` tables
  2. No foreign key errors
  3. Running it twice results in 0 duplicate rows (UPSERT idempotency)
  4. A failing UPSERT rolls back the entire transaction, leaving `raw_scrape_logs.status` as `pending`
* **Definition of Done:** Parse script reads raw JSON, strictly validates it with Zod, and populates the relational tables correctly within a transaction. Running it twice results in 0 duplicate rows.

## **Wave 4: Automation & Job Queuing**

*Goal: Connect Wave 2 and Wave 3 using Graphile Worker so it runs automatically.*

1. **Install Graphile Worker:** Add it to `apps/worker` and run its internal database setup (`graphile-worker --schema-only` to create `graphile_worker` schema tables).
2. **Define Tasks:**
   * Create a `scrapeUrl` task (wraps Wave 2 logic).
   * Create a `processRawLog` task (wraps Wave 3 logic).
3. **Chain the Tasks:** Modify the `scrapeUrl` task so that upon success, it uses Graphile's `addJob` function to instantly queue a `processRawLog` task.
4. **Cron Scheduling:** Configure Graphile to automatically queue a `scrapeUrl` task every day at 2:00 AM.
5. **Rate Limiting:** Configure Graphile Worker concurrency to allow only 1 Phase-1 task every 5 seconds.
* **Verification Strategy:** 🟢 **100% Agent Verifiable.** Agent must write an integration test that manually pushes a `scrapeUrl` job into the Postgres queue, runs the Graphile Worker using `runOnce()`, and asserts the `raw_scrape_logs` table is populated AND a new `processRawLog` job is added to the queue.
* **Definition of Done:** Worker process can be started, a job can be manually inserted, and the logs show automatic scraping and processing in sequence.

## **Wave 5: The Read-Only API Layer**

*Goal: Serve the cleanly aggregated data to the outside world.*

1. **Initialize Fastify:** Set up the Fastify server in `apps/api`.
2. **Connect to DB:** Import the shared Kysely instance from `packages/db`.
3. **Configure CORS:** Install `@fastify/cors` and allow requests from `http://localhost:7373` (Vite dev server).
4. **Build Endpoints:**
   * `GET /competitions/:id/standings` → Returns the sorted league table.
   * `GET /teams/:id/fixtures` → Returns recent and upcoming matches (paginated, default 20 per page).
   * `GET /players/:id/stats` → Returns aggregated win/loss records (JOIN `rubbers`, exclude `outcome_type = 'walkover'`).
5. **Add Type Providers:** Connect Fastify with Zod type providers so API responses are strictly typed.
6. **Error Responses:** All endpoints return consistent error shapes: `{ error: string, statusCode: number }` for 404 and 500.
7. **Pagination:** List endpoints accept `?limit=N&offset=N` query parameters.
* **Verification Strategy:** 🟢 **100% Agent Verifiable.** Agent must use Supertest alongside Vitest to write tests that boot the Fastify server, hit the endpoints, and assert HTTP 200 statuses, correct Zod-validated JSON shapes, pagination behavior, and CORS headers.
* **Definition of Done:** API endpoints successfully return clean, fast JSON data queried directly from the relational tables with proper CORS, pagination, and error handling.

## **Wave 6: The Frontend Dashboard (MVP UI)**

*Goal: Build the user-facing mobile-first website.*

1. **Initialize Vite:** Create a React + TypeScript app (`apps/web`). Add to pnpm workspace.
2. **Setup Tooling:** Install Tailwind CSS, React Router, and TanStack Query.
3. **Environment Config:** Configure API base URL via environment variable (`VITE_API_URL`, defaulting to `http://localhost:4003`).
4. **Build Components:**
   * **Dashboard:** A unified feed of recent results.
   * **League Table View:** A clean, mobile-optimized data table.
   * **Player Profile:** A summary page showing the user's win percentage and upcoming fixtures.
5. **Connect to API:** Use TanStack Query to fetch data from the Fastify API. Include loading and error states for all queries.
* **Verification Strategy:** 🟡 **Hybrid.**
  * *Agent:* Write React Testing Library tests to verify components render without crashing and map over mock API data correctly. Verify loading and error states render.
  * *Human:* Open `localhost:7373` and visually verify the Tailwind UI, mobile responsiveness, and overall UX.
* **Definition of Done:** Web app runs, user can navigate between views, and data loads instantly via TanStack query caching.

## **Wave 7: Expansion & Polish (Post-MVP)**

*Goal: Expand functionality to harder platforms and prepare for real users.*

1. **HTML Parsing:** Revisit Wave 2/3, but this time target **TableTennis365**. Write a new Extractor and a new Parser using **Cheerio** to navigate the raw HTML tables.
2. **Supabase Auth:** Integrate Supabase into the React app and Fastify API. Determine the relationship between Supabase's `auth.users` and the app's `users` table (likely: use Supabase `auth.users` directly and drop the custom `users` table, keeping only `user_linked_profiles` with a FK to the Supabase user ID).
3. **Database Migration:** Write a Kysely migration to create the `user_linked_profiles` table (and `users` if still needed).
4. **Profile Linking:** Build the UI allowing a logged-in user to search for an `ExternalPlayer` and link it to their account (populating the `user_linked_profiles` table).
5. **Authorization:** Define access rules — any authenticated user can view all public data; only the linked user can see their personal dashboard.
* **Verification Strategy:** 🟡 **Hybrid.**
  * *Human:* Save a raw `.html` file from TT365 and provide it to the agent.
  * *Agent:* Write the Cheerio selectors and Vitest suites to verify it extracts the right data out of the provided mock HTML file.
* **Definition of Done:** The app successfully aggregates data from both API-based (TT Leagues) and HTML-based (TT365) sources side-by-side, with user authentication and profile linking working.