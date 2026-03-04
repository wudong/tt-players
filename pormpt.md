# **AI Agent Prompting Guide: Table Tennis Aggregator**

This document contains the exact prompts to feed your AI coding agent (e.g., Cursor, Copilot, Claude) to execute the Implementation Plan.

## **🧠 Context Engineering (The "System Prompt")**

*Before starting, ensure your agent has read the following files. In Cursor, you can do this by mentioning them with the @ symbol in the chat.*

* @schema.md
* @tech-stack.md
* @architecture.md
* @implementation-plan.md

Always start a new chat session for a new Wave to prevent the LLM from getting confused by previous code iterations. Paste the following prompts into the chat for each phase.

## **🌊 Wave 1: Foundation (Monorepo & Database)**

**Prompt:**

Act as an Expert Full-Stack TypeScript Data Engineer.

We are building a "Table Tennis Aggregator" app. You have read the schema, architecture, and tech stack documents.

**TASK: Execute Wave 1 (The Foundation)**

1. Initialize a pnpm workspace with three packages: apps/api (for Fastify later), apps/worker (for Graphile later), and packages/db (for our database layer).
2. Create a docker-compose.yml at the root to spin up a PostgreSQL 15 database.
3. In packages/db, set up Kysely with the pg dialect. Use dotenv to load DATABASE\_URL from .env.
4. Write the exact Kysely migration files to build the PostgreSQL enum types, relational tables, unique constraints, and the raw\_scrape\_logs staging table exactly as defined in the schema.md document. Use strict typing.
5. Export the generated Kysely types so the rest of the workspace can use them.
6. Define `pnpm db:migrate` and `pnpm db:migrate:down` scripts.

**TDD CONSTRAINT (CRITICAL):**

Before you write the Kysely migrations or the workspace configuration, you MUST write a Vitest test suite in packages/db that runs the migrations against a test database and queries the information\_schema to verify every table and column exists with the correct types. The tests must also verify all unique constraints and enum types exist. Use the Docker Postgres instance with a separate test database name.

Show me the tests first. Once I approve, implement the workspace and migrations to make the tests pass.

## **🌊 Wave 2: Extract Pipeline (Phase 1 ETL)**

*Preparation: You must have a sample JSON string from a TT Leagues network request ready.*

**Prompt:**

Act as an Expert Node.js Data Engineer.

**TASK: Execute Wave 2 (The Extract Pipeline)**

1. In apps/worker, write an extraction script (extractor.ts) that uses native `fetch` (Node 18+) to fetch data from a given URL.
2. The script must take the response body and generate a SHA256 hash using Node's native crypto module.
3. Using our shared packages/db Kysely instance, it must INSERT the payload, hash, and URL into the raw\_scrape\_logs table.
4. Use the `UNIQUE(endpoint_url, payload_hash)` constraint for UPSERT: if the same URL returns the same data (same hash), ON CONFLICT DO UPDATE the `scraped_at` timestamp but NOT duplicate the row. A different URL with the same hash should insert a separate valid row.
5. Handle HTTP errors (403, 500, DNS failures) gracefully — log the error and allow Graphile Worker to retry.

**TDD CONSTRAINT:**

Write a Vitest suite that mocks `fetch`. Test three scenarios: 1\. A new URL+hash is inserted successfully. 2\. An identical URL+hash triggers an update to `scraped_at`, not a new row. 3\. A different URL with the same hash inserts a separate valid row.

Show me the tests first. Wait for my approval before writing extractor.ts.

## **🌊 Wave 3: Transform & Load Pipeline (Phase 2 ETL)**

*Preparation: Replace \[INSERT MOCK JSON HERE\] with the actual data.*

**Prompt:**

Act as an Expert Node.js ETL Engineer.

**TASK: Execute Wave 3 (Transform & Load)**

Here is a sample JSON payload from our target API:

\[INSERT MOCK JSON HERE\]

1. In apps/worker, write strict Zod schemas (zod-schemas.ts) that perfectly match this JSON structure.
2. Write a parser function (parser.ts) that takes this JSON, validates it with Zod, and transforms it into the shapes required by our database schema.
3. Write a loader function (loader.ts) that uses Kysely to perform bulk INSERT ... ON CONFLICT DO UPDATE (UPSERTs) into the `external_players`, `teams`, `fixtures`, `rubbers`, and `league_standings` tables based on their composite unique constraints. **All UPSERTs must be wrapped in a single `db.transaction()`.** If any fails, the entire batch rolls back.
4. Upon success, update the raw\_scrape\_logs row status to 'processed'. On failure, set status to 'failed'.

**TDD CONSTRAINT:**

Save the JSON I provided as mock\_tt\_leagues.json. Write a Vitest suite that feeds this mock data into your parser and loader. Tests must run against a **test Postgres database** and assert that:
1. Exactly the correct number of rows are added to each table
2. No foreign key errors occur
3. Running it twice results in 0 duplicate rows (UPSERT idempotency)
4. A failing UPSERT rolls back the entire transaction, leaving raw\_scrape\_logs.status as 'pending'

Show me the tests first. Wait for my approval before writing the implementation.

## **🌊 Wave 4: Automation (Graphile Worker)**

**Prompt:**

Act as an Expert Node.js Infrastructure Engineer.

**TASK: Execute Wave 4 (Automation & Queuing)**

1. Install and configure graphile-worker in apps/worker. Run `graphile-worker --schema-only` to create its internal database tables.
2. Create a Graphile task called scrapeUrlTask that wraps the extractor.ts logic from Wave 2\.
3. Create a Graphile task called processLogTask that wraps the parser.ts and loader.ts logic from Wave 3\.
4. Chain them: When scrapeUrlTask succeeds, it must use Graphile's addJob to immediately queue a processLogTask for that specific log ID.
5. Configure Graphile's built-in cron scheduler to queue a scrapeUrlTask every day at 2:00 AM.
6. Configure concurrency to allow only 1 Phase-1 task every 5 seconds (rate limiting).

**TDD CONSTRAINT:**

Write an integration test that manually pushes a scrapeUrlTask job into the Postgres queue, runs the Graphile Worker using `runOnce()`, and asserts that the raw\_scrape\_logs table is populated AND a new processLogTask is added to the queue.

Show me the test first. Wait for my approval.

## **🌊 Wave 5: Read-Only API (Fastify)**

**Prompt:**

Act as an Expert API Developer using Fastify and Kysely.

**TASK: Execute Wave 5 (API Layer)**

1. Set up a Fastify server in apps/api.
2. Configure @fastify/type-provider-zod for strict typing.
3. Configure @fastify/cors to allow requests from `http://localhost:7373`.
4. Connect to the shared packages/db Kysely database.
5. Create three GET endpoints:
   * GET /competitions/:id/standings (Returns sorted league table)
   * GET /teams/:id/fixtures (Returns team matches, ordered by date, paginated with `?limit=N&offset=N`)
   * GET /players/:id/stats (Returns player win/loss records by joining external\_players and rubbers, excluding outcome\_type = 'walkover')
6. All endpoints return consistent error shapes: `{ error: string, statusCode: number }` for 404 and 500.

**TDD CONSTRAINT:**

Write a Supertest \+ Vitest suite. Seed the test database with one mock league, one team, and one match. Assert that all three endpoints return HTTP 200 and the exact expected JSON schema. Also test CORS headers and pagination behavior.


## **🌊 Wave 6: Frontend Dashboard (React + Vite)**

**Prompt:**

Act as an Expert React & Tailwind UI Developer.

**TASK: Execute Wave 6 (Frontend MVP)**

1. In apps/web, initialize a Vite React TypeScript project. Add to the pnpm workspace.
2. Install and configure Tailwind CSS, React Router, and @tanstack/react-query.
3. Configure API base URL via environment variable (`VITE_API_URL`, defaulting to `http://localhost:4003`).
4. Build a mobile-first UI with 3 primary components:
   * Dashboard.tsx: A feed of recent match results.
   * LeagueTable.tsx: A clean data table showing won, lost, points.
   * PlayerProfile.tsx: A summary showing win % and historical rubbers.
5. Create custom React Query hooks to fetch data from our Fastify API. Include loading and error states for all queries.

**TDD CONSTRAINT:**

Write React Testing Library tests that mock the TanStack Query responses. Verify that the LeagueTable component correctly maps over the mock data and renders the team names and points without crashing. Verify loading and error states render correctly.

Show me the tests first. Wait for my approval before writing the React components.

## **🌊 Wave 7: HTML Scraping Expansion (Cheerio)**

*Preparation: Replace \[INSERT RAW HTML HERE\] with the actual HTML table copied from TT365.*

**Prompt:**

Act as an Expert Web Scraper.

**TASK: Execute Wave 7 (HTML Scraping for TT365 + Auth)**

**Part A: HTML Scraping**

Here is a snippet of raw HTML from an older table tennis website:

\[INSERT RAW HTML HERE\]

1. In apps/worker, create a new parser (tt365-parser.ts).
2. Use cheerio to parse this HTML string.
3. Write CSS selectors to extract the Team Names, Player Names, and Match Scores.
4. Map this extracted data into the exact same database shapes used by our previous JSON loader.

**Part B: Authentication & Profile Linking**

1. Integrate Supabase Auth into the React app and Fastify API.
2. Write a Kysely migration to create the `user_linked_profiles` table.
3. Build the UI allowing a logged-in user to search for an ExternalPlayer and link it to their account.

**TDD CONSTRAINT:**

Save the HTML I provided into a file. Write a Vitest suite that passes this file into your cheerio parser. Assert that the extracted JavaScript objects exactly match the expected match results.

Show me the tests first. Wait for my approval before implementing the Cheerio logic.