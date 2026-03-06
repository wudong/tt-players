import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE UNLOGGED TABLE IF NOT EXISTS cache_entries (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            type varchar NOT NULL,
            cache_key varchar NOT NULL,
            content jsonb NOT NULL,
            source_version varchar,
            expires_at timestamptz NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
    `.execute(db);

    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_cache_entries_type_key
        ON cache_entries(type, cache_key)
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at
        ON cache_entries(expires_at)
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP INDEX IF EXISTS idx_cache_entries_expires_at`.execute(db);
    await sql`DROP INDEX IF EXISTS uq_cache_entries_type_key`.execute(db);
    await sql`DROP TABLE IF EXISTS cache_entries`.execute(db);
}
