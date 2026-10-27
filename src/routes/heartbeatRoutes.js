import { Router } from 'express';
import { heartbeatController } from '../controllers/heartbeatController.js';

export default function heartbeatRoutes() {
  const router = Router();

  router.post('/heartbeats/:serviceId', heartbeatController.record);

  return router;
}
