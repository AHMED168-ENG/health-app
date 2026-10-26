import http from 'node:http';
import cron from 'node-cron';
import env from './config/env.js';
import { logger } from './config/logger.js';
import createApp from './app.js';
import { heartbeatTracker } from './services/heartbeatService.js';
import { sendAlert } from './services/alertService.js';

const server = http.createServer(createApp());
server.listen(env.port, () => {
  logger.info(`Heartbeat Alert Service started on port ${env.port}`, {
    downAfterMinutes: env.downAfterMinutes,
    checkCron: env.checkCron,
    recipients: env.alertRecipients,
  });
});

// Every CHECK_CRON cycle: flag services whose heartbeat went stale.
const check = cron.schedule(env.checkCron, async () => {
  try {
    for (const event of heartbeatTracker.detectOutages(Date.now())) {
      logger.warn(`Service ${event.serviceId} is DOWN`, { type: event.type });
      await sendAlert(event);
    }
  } catch (error) {
    logger.error('Outage check failed', { error: error.message });
  }
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  check.stop();
  server.close(() => process.exit(0));
}
