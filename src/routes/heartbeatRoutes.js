import { Router } from 'express';
import { heartbeatController } from '../controllers/heartbeatController.js';

export default function heartbeatRoutes() {
  const router = Router();

  // Called by the monitored backend's cron job, e.g.
  //   POST /api/v1/heartbeats/rcm-api   with header X-API-Key
  router.post('/heartbeats/:serviceId', heartbeatController.record);

  return router;
}
