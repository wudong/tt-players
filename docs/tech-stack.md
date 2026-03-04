# **Tech Stack Architecture: Postgres-Maximalist ETL**

This document outlines the specific technologies chosen to implement the Table Tennis Aggregator application. The core philosophy is **Postgres-Maximalism** paired with a strict **TypeScript/Node.js** backend.

By pushing as much operational responsibility (data storage, job queuing, cron scheduling) into PostgreSQL as possible, we eliminate the need for external services like Redis, keeping the infrastructure radically simple and highly performant.

## **1\. Project Structure & Tooling**

* **Monorepo Manager:** pnpm (pnpm workspaces)
  * *Role:* Manages the entire codebase (frontend, API server, background workers, and shared types) in a single repository.
  * *Why:* pnpm is exceptionally fast, uses a global store to save disk space, and handles workspace hoisting better than npm or Yarn. It allows our Node workers and Fastify API to seamlessly share the exact same Kysely database types without needing to publish private packages.

* **Language:** TypeScript (Strict Mode) — all packages
* **Runtime:** Node.js (v18+, required for native `fetch`)

## **2\. Core Infrastructure**

* **Database:** PostgreSQL (v15+)
  * *Role:* The single source of truth. It holds the relational schema, the raw staging logs (TEXT), and acts as the message queue.
* **Job Queue & Scheduler:** Graphile Worker
  * *Role:* A high-performance Node.js job queue backed natively by PostgreSQL.
  * *Why:* It leverages Postgres' native `LISTEN/NOTIFY` and `FOR UPDATE SKIP LOCKED` features to start jobs in milliseconds. It includes built-in cron scheduling, completely eliminating the need for Redis or separate cron servers.
* **Authentication:** Supabase Auth *(Deferred to Wave 7)*
  * *Role:* Will handle user login and session management in future iterations. For the current scraping and aggregation MVP, user authentication is intentionally deferred.

## **3\. Backend & API Layer**

* **API Framework:** Fastify
  * *Role:* Serves the clean, aggregated data to the user dashboard.
  * *Why:* Fastify is significantly faster than Express and has fantastic native JSON schema validation. It runs completely independently from the ETL scraping workers.
* **Database Query Builder & Migrations:** Kysely
  * *Role:* Interacts with the database from the Node.js workers and the API, and handles database schema migrations.
  * *Why:* Kysely provides 100% type-safe SQL without the memory overhead of a traditional ORM. Crucially, it features a **native TypeScript migration system**, allowing us to define and roll back database tables using pure, type-checked TypeScript code rather than raw SQL files.

## **4\. Development & Testing Tooling**

* **Containerization:** Docker + docker-compose
  * *Role:* Spins up a local PostgreSQL 15 instance for development and testing. Ensures consistent environments across machines.
* **Test Framework:** Vitest
  * *Role:* Runs all unit and integration tests across the monorepo. Used in every wave for TDD verification.
  * *Why:* Native TypeScript support, fast execution, and compatible with the Vite ecosystem used in the frontend.
* **TypeScript Execution:** tsx
  * *Role:* Runs TypeScript files directly (migrations, scripts) without a separate compile step.
* **Environment Variables:** dotenv
  * *Role:* Loads `.env` files for connection strings, API URLs, and secrets. A `.env.example` template is committed to the repo.
* **Code Quality:** ESLint + Prettier *(optional, added as needed)*

## **5\. Pre-Scrape Target Analysis**

Before any automated scraping begins, target websites must be mapped out.

* **Analysis Tool:** Playwright CLI
  * *Role:* Used manually by the developer during the setup phase for a new league platform.
  * *Why:* Playwright's CLI and Inspector allow the developer to boot up a browser, intercept network traffic to find hidden JSON APIs (like on TT Leagues), and inspect the DOM structure (like on TT365) to accurately write the Cheerio/Zod parsing logic before deploying the automated background workers.

## **6\. Extract & Transform Utilities (The Automated Scrapers)**

These tools run inside the Graphile Worker background processes.

* **HTTP Client:** Native Node.js `fetch` (built into Node 18+)
  * *Role:* Handles the Phase 1 web requests to TT Leagues and TT365.
  * *Why:* Zero dependencies. Built into the runtime.
* **HTML Parser:** Cheerio
  * *Role:* Used in Phase 2 to parse older, HTML-based sites like TT365. It runs entirely on the server and provides a jQuery-like API to extract table rows instantly.
* **JSON Validator:** Zod
  * *Role:* Used in Phase 2 to parse modern APIs (like TT Leagues). Zod ensures that if the target website changes its hidden API structure, our parser catches the error gracefully instead of silently corrupting our database.
* **Hashing:** Node.js Native crypto (`crypto.createHash('sha256')`)
  * *Role:* Generates the `payload_hash` in Phase 1 to detect if a league website's data has changed before we waste CPU cycles parsing it.

## **7\. Frontend Layer (User Dashboard)**

Since we are avoiding Next.js to keep the backend API decoupled from the UI, the frontend is a pure Single Page Application (SPA).

* **Framework:** React
* **Bundler:** Vite
  * *Why:* Provides lightning-fast cold starts and instant Hot Module Replacement (HMR) during development. No Server-Side Rendering (SSR) overhead.
* **Data Fetching:** TanStack Query (React Query)
  * *Role:* Handles caching the API responses in the user's browser. If a user toggles between "League Tables" and "Player Stats", React Query serves it instantly from memory without hitting the Fastify API twice.
* **Styling:** Tailwind CSS
  * *Role:* Utility-first CSS for building a responsive, mobile-first UI (crucial since players will primarily check this app on their phones at the table tennis venue).

## **Architecture Flow Summary**

1. **Phase 0 (Manual):** Developer uses **Playwright CLI** to analyze a new league website and writes the Zod/Cheerio parsing rules.
2. **Graphile Worker (Scheduler)** triggers a cron job at 2:00 AM.
3. **Node Worker A (Phase 1)** uses native **fetch** to fetch the target URL, hashes the payload with **crypto**, and uses **Kysely** to save the raw data into Postgres.
4. **Graphile Worker** immediately queues a parse job using `LISTEN/NOTIFY`.
5. **Node Worker B (Phase 2)** wakes up, checks the hash, uses the predefined **Cheerio/Zod** logic to extract the stats, and runs a massive bulk UPSERT via **Kysely** (wrapped in a transaction) into the relational tables.
6. A player opens the **Vite/React** app on their phone.
7. **TanStack Query** makes a request to the **Fastify** API.
8. Fastify uses **Kysely** to instantly fetch the clean data from Postgres and serves it to the user.