import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('regions')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('slug', 'varchar', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addUniqueConstraint('uq_regions_slug', ['slug'])
        .execute();

    await db.schema
        .createTable('league_regions')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('league_id', 'uuid', (col) =>
            col.notNull().references('leagues.id').onDelete('cascade')
        )
        .addColumn('region_id', 'uuid', (col) =>
            col.notNull().references('regions.id').onDelete('cascade')
        )
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addUniqueConstraint('uq_league_regions_league_region', [
            'league_id',
            'region_id',
        ])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('league_regions').ifExists().execute();
    await db.schema.dropTable('regions').ifExists().execute();
}
