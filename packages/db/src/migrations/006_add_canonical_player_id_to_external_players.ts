import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('external_players')
        .addColumn('canonical_player_id', 'uuid', (col) =>
            col.references('external_players.id')
        )
        .execute();

    await sql`
        CREATE INDEX idx_external_players_canonical_player_id
        ON external_players (canonical_player_id)
    `.execute(db);

    // Initialize canonical identity to self for existing rows.
    await sql`
        UPDATE external_players
        SET canonical_player_id = id
        WHERE canonical_player_id IS NULL
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP INDEX IF EXISTS idx_external_players_canonical_player_id`.execute(db);

    await db.schema
        .alterTable('external_players')
        .dropColumn('canonical_player_id')
        .execute();
}
