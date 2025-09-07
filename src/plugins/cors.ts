import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from '../config/config';

export const corsPlugin = new Elysia({ name: 'cors' })
  .use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400, // 24 hours
  }));