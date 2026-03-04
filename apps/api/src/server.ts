import 'dotenv/config';
import { db } from './db.js';
import { buildApp } from './app.js';

const PORT = Number(process.env['PORT']) || 4003;

const app = await buildApp(db);

try {
    const address = await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀  API server listening at ${address}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
