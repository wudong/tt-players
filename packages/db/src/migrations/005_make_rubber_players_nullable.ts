import { type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rubbers')
        .alterColumn('home_player_1_id', (col) => col.dropNotNull())
        .alterColumn('away_player_1_id', (col) => col.dropNotNull())
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rubbers')
        .alterColumn('home_player_1_id', (col) => col.setNotNull())
        .alterColumn('away_player_1_id', (col) => col.setNotNull())
        .execute();
}
