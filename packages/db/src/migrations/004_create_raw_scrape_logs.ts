import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('raw_scrape_logs')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('platform_id', 'uuid', (col) =>
            col.notNull().references('platforms.id')
        )
        .addColumn('endpoint_url', 'varchar', (col) => col.notNull())
        .addColumn('raw_payload', 'text', (col) => col.notNull())
        .addColumn('payload_hash', 'varchar', (col) => col.notNull())
        .addColumn('scraped_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('status', sql`scrape_status`, (col) => col.notNull())
        .addUniqueConstraint('uq_raw_scrape_logs_url_hash', [
            'endpoint_url',
            'payload_hash',
        ])
        .execute();

    // Index on payload_hash for fast lookups during dedup checks
    await db.schema
        .createIndex('idx_raw_scrape_logs_payload_hash')
        .on('raw_scrape_logs')
        .column('payload_hash')
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropIndex('idx_raw_scrape_logs_payload_hash').ifExists().execute();
    await db.schema.dropTable('raw_scrape_logs').ifExists().execute();
}
