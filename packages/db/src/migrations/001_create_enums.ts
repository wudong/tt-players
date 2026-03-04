import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`CREATE TYPE competition_type AS ENUM ('league', 'team_cup', 'individual')`.execute(db);
    await sql`CREATE TYPE fixture_status AS ENUM ('upcoming', 'completed', 'postponed')`.execute(db);
    await sql`CREATE TYPE outcome_type AS ENUM ('normal', 'walkover', 'retired', 'void')`.execute(db);
    await sql`CREATE TYPE scrape_status AS ENUM ('pending', 'processed', 'failed')`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP TYPE IF EXISTS scrape_status`.execute(db);
    await sql`DROP TYPE IF EXISTS outcome_type`.execute(db);
    await sql`DROP TYPE IF EXISTS fixture_status`.execute(db);
    await sql`DROP TYPE IF EXISTS competition_type`.execute(db);
}
