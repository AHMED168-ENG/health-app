import {
  downtimeEmail,
  downtimeReminderEmail,
  recoveryEmail,
} from './email/templates/downtime.js';
import { sendEmail } from './email/transporter.js';
import env from '../config/env.js';

/** Sends the matching email for a down / down_reminder / recovered event. */
export async function sendAlert(alert) {
  const shared = {
    serviceId: alert.serviceId,
    thresholdMinutes: env.downAfterMinutes,
    timeZone: env.alertTimeZone,
  };

  let message;

  if (alert.type === 'down') {
    message = downtimeEmail({ ...shared, lastHeartbeatAt: alert.lastHeartbeatAt, detectedAt: alert.detectedAt });
  } else if (alert.type === 'down_reminder') {
    message = downtimeReminderEmail({
      ...shared,
      lastHeartbeatAt: alert.lastHeartbeatAt,
      now: alert.now,
    });
  } else if (alert.type === 'recovered') {
    message = recoveryEmail({
      ...shared,
      lastSeenAt: alert.lastSeenAt,
      recoveredAt: alert.lastHeartbeatAt,
    });
  } else {
    return;
  }

  return sendEmail(message);
}
