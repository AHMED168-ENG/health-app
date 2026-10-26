import { timingSafeEqual } from 'node:crypto';
import express from 'express';
import heartbeatRoutes from './routes/heartbeatRoutes.js';

function requireApiKey(req, res, next) {
  const provided = Buffer.from(req.get('X-API-Key') ?? '');
  const expected = Buffer.from(process.env.HEARTBEAT_API_KEY);
  const ok = provided.length === expected.length && timingSafeEqual(provided, expected);

  if (!ok) {
    return res.status(401).json({ error: 'Invalid or missing X-API-Key header' });
  }
  return next();
}

export default function createApp() {
  const app = express();

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(express.json({ limit: '16kb' }));
  app.use('/api/v1', requireApiKey, heartbeatRoutes());

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
