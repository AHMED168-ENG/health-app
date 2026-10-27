import baseLayout from './base.js';
import {
  formatDuration,
  formatLocalTimestamp,
  formatUtcTimestamp,
  timeZoneOffsetLabel,
} from './format.js';

function timeZoneCaption(timeZone) {
  const offset = timeZoneOffsetLabel(timeZone);
  return offset ? `Times shown in ${timeZone} (${offset}).` : `Times shown in ${timeZone}.`;
}

function thresholdLabel(thresholdMinutes) {
  return formatDuration(thresholdMinutes * 60_000);
}

export function downtimeEmail({ serviceId, lastHeartbeatAt, detectedAt, thresholdMinutes, timeZone }) {
  const downFor = Math.max(0, detectedAt - lastHeartbeatAt);

  return baseLayout({
    status: 'down',
    statusLabel: 'Service Down',
    subject: `🔴 DOWN: ${serviceId}`,
    title: `"${serviceId}" is not responding`,
    intro: `No heartbeat has arrived from "${serviceId}" for ${thresholdLabel(thresholdMinutes)}.`,
    rows: [
      ['Last seen', formatLocalTimestamp(lastHeartbeatAt, timeZone)],
      ['Down for', formatDuration(downFor)],
    ],
    details: [
      ['Last heartbeat (UTC)', formatUtcTimestamp(lastHeartbeatAt)],
      ['Alert threshold', thresholdLabel(thresholdMinutes)],
      ['Email generated (UTC)', formatUtcTimestamp(detectedAt)],
    ],
    caption: timeZoneCaption(timeZone),
    footer: 'Generated automatically by the Heartbeat Alert Service.',
  });
}

export function downtimeReminderEmail({ serviceId, lastHeartbeatAt, now, thresholdMinutes, timeZone }) {
  const downFor = formatDuration(Math.max(0, now - lastHeartbeatAt));

  return baseLayout({
    status: 'down',
    statusLabel: 'Still Down',
    subject: `🔴 Still down: ${serviceId} (${downFor})`,
    title: `"${serviceId}" is still down`,
    intro: `No heartbeat has arrived for ${downFor}.`,
    rows: [
      ['Last seen', formatLocalTimestamp(lastHeartbeatAt, timeZone)],
      ['Down for', downFor],
    ],
    details: [
      ['Last heartbeat (UTC)', formatUtcTimestamp(lastHeartbeatAt)],
      ['Alert threshold', thresholdLabel(thresholdMinutes)],
      ['Reminder generated (UTC)', formatUtcTimestamp(now)],
    ],
    caption: timeZoneCaption(timeZone),
    note: 'This is a reminder. The first alert was already sent.',
    footer: 'Generated automatically by the Heartbeat Alert Service.',
  });
}

export function recoveryEmail({ serviceId, lastSeenAt, recoveredAt, thresholdMinutes, timeZone }) {
  const downFor = formatDuration(Math.max(0, recoveredAt - lastSeenAt));

  return baseLayout({
    status: 'recovered',
    statusLabel: 'Service Recovered',
    subject: `🟢 Back online: ${serviceId} (was down ${downFor})`,
    title: `"${serviceId}" is back online`,
    intro: `Heartbeats from "${serviceId}" have resumed.`,
    rows: [
      ['Last seen', formatLocalTimestamp(lastSeenAt, timeZone)],
      ['Back at', formatLocalTimestamp(recoveredAt, timeZone)],
      ['Down for', downFor],
    ],
    details: [
      ['Last heartbeat before outage (UTC)', formatUtcTimestamp(lastSeenAt)],
      ['Alert threshold', thresholdLabel(thresholdMinutes)],
      ['Recovered at (UTC)', formatUtcTimestamp(recoveredAt)],
    ],
    caption: timeZoneCaption(timeZone),
    footer: 'Generated automatically by the Heartbeat Alert Service. No action required.',
  });
}
