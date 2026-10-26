import { heartbeatTracker } from '../services/heartbeatService.js';
import { sendAlert } from '../services/alertService.js';
import { logger } from '../config/logger.js';

const SERVICE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;

export const heartbeatController = {
  async record(req, res) {
    const { serviceId } = req.params;

    if (!SERVICE_ID_PATTERN.test(serviceId)) {
      return res.status(400).json({ error: 'Invalid serviceId (letters, digits, dot, dash, underscore)' });
    }

    const result = heartbeatTracker.record(serviceId, Date.now());
    logger.info(`Heartbeat from ${serviceId}`, { event: result.event });

    if (result.event === 'recovered') {
      // A failed recovery email must not fail the heartbeat itself.
      try {
        await sendAlert({ type: 'recovered', serviceId, ...result });
      } catch (error) {
        logger.error(`Recovery alert for ${serviceId} failed`, { error: error.message });
      }
    }

    return res.status(202).json({
      serviceId,
      recordedAt: new Date(result.lastHeartbeatAt).toISOString(),
      event: result.event,
    });
  },
};
