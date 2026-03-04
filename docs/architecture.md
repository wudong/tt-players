# **Scraper Architecture: The ETL Pipeline**

Building a web scraping application that pulls data from multiple local UK table tennis websites (TT Leagues, TT365) requires a robust architecture. If you scrape directly into your relational database synchronously, your app will be slow, prone to crashing, and likely to get IP banned.

The solution is an **Asynchronous ETL (Extract, Transform, Load) Pipeline**. To keep infrastructure simple and highly performant for this domain, we use a **Postgres-Maximalist** stack.

## **Core Components**

### **1\. The Queue & Scheduler (PostgreSQL Native)**

We use PostgreSQL to handle our jobs via **Graphile Worker**. This utilizes Postgres's `FOR UPDATE SKIP LOCKED` feature to safely distribute work, and `LISTEN/NOTIFY` for near-instant job pickup.

* **The Scheduler:** Built into Graphile Worker's cron system. It automatically inserts a "Scrape Website X" ticket into the Postgres queue table every night at 2:00 AM.
* **The Queue:** Holds the "tickets" and distributes them to background workers. It handles retries, delays, and rate-limiting natively within the database.

### **2\. Phase 1: The Extract Workers ("The Scrapers")**

These are lightweight background scripts. Their *only* job is to hit the target URL, grab the HTML/JSON, and save it. They do not calculate stats or read database relationships.

* **Trigger:** The Queue hands the worker a ticket: *"Scrape Brentwood Div 1"*
* **Action:** The worker fetches the HTML/JSON from the target URL using native `fetch`.
* **Storage:** The worker hashes the raw HTML/JSON string. It then uses Kysely to save the raw text and the hash into the `raw_scrape_logs` database table.
* **Dedup check:** Before inserting, the worker checks if a row with the same `endpoint_url` already has the same `payload_hash`. If so, it updates `scraped_at` instead of creating a new row (SQL UPSERT on the `UNIQUE(endpoint_url, payload_hash)` constraint).
* **Handoff:** The worker tells the Queue: *"I saved Log #123. Create a new ticket to process it."*

### **3\. Phase 2: The Transform/Load Workers ("The Parsers")**

These scripts are the brains of the operation. They read the raw data saved by Phase 1 and figure out what it means.

* **Trigger:** The Queue hands the worker a ticket: *"Process Log #123"*
* **Action:** The worker pulls the raw HTML/JSON from the `raw_scrape_logs` table.
* **Deduplication (The Hash Check):** Before parsing, the worker looks at the `payload_hash`. It checks if the previous scrape of this same URL had the exact same hash. If it matches, the data hasn't changed! The worker marks the log as "Processed" and stops immediately, saving compute power.
* **Parsing:** If the hash is new, the worker parses the names, teams, and scores out of the HTML (using Cheerio) or JSON (using Zod).
* **Loading (via Kysely):** The worker uses Kysely to execute highly performant bulk UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) commands **within a single database transaction** to push the parsed data into the main relational schema (`league_standings`, `fixtures`, `rubbers`, etc.). If any UPSERT fails, the entire transaction rolls back and the log stays `pending`.

## **Failure Handling**

1. **Phase 1 failures** (network errors, DNS failures, HTTP 403/500): Graphile Worker automatically retries with exponential backoff. After 5 failed attempts, the job is marked as permanently failed.
2. **Phase 2 failures** (parsing errors, DB constraint violations): The `raw_scrape_logs.status` is set to `failed`. The raw payload is preserved intact so the developer can fix the parser and reprocess without re-scraping.
3. **Alerting:** Failed jobs remain in Graphile Worker's `jobs` table for inspection. A future enhancement could send notifications via email or Slack webhook.

## **Connection Pooling**

Each Node.js process (Fastify API server, Graphile Worker) maintains its own Kysely/pg connection pool, configured with `max: 10` connections. Graphile Worker uses its own dedicated pool internally. Total pool size should not exceed Postgres's `max_connections` (default 100).

## **Why This Architecture is Essential**

1. **Consolidated Infrastructure:** By using PostgreSQL for data, queuing, and scheduling, you avoid the cost and complexity of maintaining Redis and separate cron servers.
2. **Rate Limiting:** You can configure Graphile Worker to only allow 1 Phase-1 worker to run every 5 seconds. This ensures you never overwhelm local league servers, preventing IP bans.
3. **Fault Tolerance:** If TT365 goes offline for an hour, the Phase 1 worker fails. The queue simply says, *"I'll try this ticket again in 30 minutes."* No data is missed.
4. **Parser Recoverability:** If a target website changes its layout, your Phase 2 parsers will crash. However, your Phase 1 scrapers will continue saving the raw HTML safely into `raw_scrape_logs`. Once you fix your parsing code, you simply tell the queue to re-run the failed parsing jobs. You don't have to re-scrape the target websites!