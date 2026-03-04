import 'dotenv/config';
import { createDb } from '@tt-players/db';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
}

export const db = createDb(DATABASE_URL);
