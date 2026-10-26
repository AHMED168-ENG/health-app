import {
  downtimeEmail,
  downtimeReminderEmail,
  recoveryEmail,
} from './email/templates/downtime.js';
import { sendEmail } from './email/transporter.js';
import env from '../config/env.js';

/** Sends the matching email for a down / down_reminder / recovered event. */
export async function sendAlert(alert) {
  let message;

  if (alert.type === 'down') {
    message = downtimeEmail({ ...alert, thresholdMinutes: env.downAfterMinutes });
  } else if (alert.type === 'down_reminder') {
    message = downtimeReminderEmail({ ...alert, thresholdMinutes: env.downAfterMinutes });
  } else if (alert.type === 'recovered') {
    message = recoveryEmail({
      serviceId: alert.serviceId,
      downSince: alert.downSince,
      recoveredAt: alert.lastHeartbeatAt,
    });
  } else {
    return;
  }

  return sendEmail(message);
}
