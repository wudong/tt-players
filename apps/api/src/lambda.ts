import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './app.js';
import { db } from './db.js';

let handlerCache: any;

export const handler = async (event: any, context: any) => {
    try {
        if (!handlerCache) {
            console.log('🚀 Initializing Fastify app for Lambda...');
            const app = await buildApp(db);
            handlerCache = awsLambdaFastify(app);
            console.log('✅ Fastify app initialized.');
        }
        return await handlerCache(event, context);
    } catch (err) {
        console.error('❌ Lambda initialization/execution failed:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) }),
        };
    }
};
