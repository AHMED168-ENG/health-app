import http from 'node:http';
import cron from 'node-cron';
import env from './config/env.js';
import createApp from './app.js';
import { heartbeatTracker } from './services/heartbeatService.js';
import { sendAlert } from './services/alertService.js';

const server = http.createServer(createApp());
server.listen(env.port, () => {
  console.log(`Heartbeat Alert Service on port ${env.port}, down after ${env.downAfterMinutes} min silence`);
});

// Every CHECK_CRON cycle: flag services whose heartbeat went stale.
const check = cron.schedule(env.checkCron, async () => {
  try {
    for (const event of heartbeatTracker.detectOutages(Date.now())) {
      await sendAlert(event);
    }
  } catch (error) {
    console.error('Outage check failed:', error.message);
  }
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  check.stop();
  server.close(() => process.exit(0));
}
