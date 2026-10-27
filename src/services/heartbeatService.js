import env from '../config/env.js';

/**
 * Tracks heartbeat arrivals per service and derives outage/recovery events.
 * All times are passed in by the caller, so the logic is trivially testable.
 */
export class HeartbeatTracker {
  #services = new Map();

  constructor({ downAfterMs, reminderEveryMs }) {
    this.downAfterMs = downAfterMs;
    this.reminderEveryMs = reminderEveryMs;
  }

  record(serviceId, now) {
    const record = this.#services.get(serviceId);

    if (!record) {
      this.#services.set(serviceId, { state: 'healthy', lastHeartbeatAt: now, lastAlertAt: null });
      return { event: 'first_seen', lastHeartbeatAt: now };
    }

    const wasDown = record.state === 'down';
    const lastSeenAt = record.lastHeartbeatAt;
    record.lastHeartbeatAt = now;

    if (wasDown) {
      record.state = 'healthy';
      record.lastAlertAt = null;
      return { event: 'recovered', downSince: record.downSinceAt, lastSeenAt, lastHeartbeatAt: now };
    }

    return { event: 'heartbeat', lastHeartbeatAt: now };
  }

  /**
   * Flags services whose heartbeat went stale, and re-flags ongoing
   * outages once the reminder interval has passed.
   */
  detectOutages(now) {
    const events = [];

    for (const [serviceId, record] of this.#services) {
      if (record.state === 'healthy') {
        if (now - record.lastHeartbeatAt >= this.downAfterMs) {
          record.state = 'down';
          record.downSinceAt = record.lastHeartbeatAt + this.downAfterMs;
          record.lastAlertAt = now;
          events.push({ type: 'down', serviceId, lastHeartbeatAt: record.lastHeartbeatAt, detectedAt: now });
        }
        continue;
      }

      const reminderDue = this.reminderEveryMs > 0 && now - record.lastAlertAt >= this.reminderEveryMs;
      if (reminderDue) {
        record.lastAlertAt = now;
        events.push({
          type: 'down_reminder',
          serviceId,
          lastHeartbeatAt: record.lastHeartbeatAt,
          detectedAt: record.downSinceAt,
          now,
        });
      }
    }

    return events;
  }
}

/** Shared instance used by the controller and the cron check. */
export const heartbeatTracker = new HeartbeatTracker({
  downAfterMs: env.downAfterMinutes * 60_000,
  reminderEveryMs: env.reminderEveryMinutes * 60_000,
});
