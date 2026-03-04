import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './app.js';
import { db } from './db.js';

const app = await buildApp(db);
export const handler = awsLambdaFastify(app);
