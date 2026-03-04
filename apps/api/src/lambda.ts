import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './app.js';
import { db } from './db.js';

let handlerCache: any;

export const handler = async (event: any, context: any) => {
    if (!handlerCache) {
        const app = await buildApp(db);
        handlerCache = awsLambdaFastify(app);
    }
    return handlerCache(event, context);
};
