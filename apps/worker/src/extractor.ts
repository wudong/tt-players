import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

/**
 * Fetches data from the given URL, hashes the response body (SHA256),
 * and upserts it into the `raw_scrape_logs` table.
 *
 * - On a new (endpoint_url, payload_hash) pair → INSERTs a new row.
 * - On a duplicate (endpoint_url, payload_hash) → UPDATEs `scraped_at` only.
 * - On HTTP errors or network failures → throws so Graphile Worker can retry.
 */
export async function extractAndStore(
    url: string,
    platformId: string,
    db: Kysely<Database>,
): Promise<string> {
    // 1. Fetch the URL (let network errors propagate naturally)
    const response = await fetch(url);

    // 2. Handle HTTP errors — throw so the job can be retried
    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status} ${response.statusText} when fetching ${url}`,
        );
    }

    // 3. Read body and compute SHA256 hash
    const body = await response.text();
    const hash = createHash('sha256').update(body).digest('hex');

    // 4. UPSERT into raw_scrape_logs
    //    UNIQUE constraint is on (endpoint_url, payload_hash).
    //    - Same URL + same hash → update scraped_at
    //    - Different URL + same hash → new row (no conflict)
    const result = await db
        .insertInto('raw_scrape_logs')
        .values({
            platform_id: platformId,
            endpoint_url: url,
            raw_payload: body,
            payload_hash: hash,
            status: 'pending',
        })
        .onConflict((oc) =>
            oc.columns(['endpoint_url', 'payload_hash']).doUpdateSet({
                scraped_at: new Date(),
            }),
        )
        .returning('id')
        .executeTakeFirstOrThrow();

    return result.id;
}
