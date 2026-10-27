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
  const silentFor = Math.max(0, detectedAt - lastHeartbeatAt);

  return baseLayout({
    status: 'down',
    statusLabel: 'Service Down',
    subject: `🔴 DOWN: ${serviceId}`,
    title: `"${serviceId}" is not responding`,
    intro: `No heartbeat has arrived from "${serviceId}" for ${thresholdLabel(thresholdMinutes)}.`,
    rows: [
      ['Last seen', formatLocalTimestamp(lastHeartbeatAt, timeZone)],
      ['Down for', formatDuration(silentFor)],
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

export function downtimeReminderEmail({
  serviceId,
  lastHeartbeatAt,
  detectedAt,
  now,
  thresholdMinutes,
  timeZone,
}) {
  const downFor = Math.max(0, now - detectedAt);
  const duration = formatDuration(downFor);

  return baseLayout({
    status: 'down',
    statusLabel: 'Still Down',
    subject: `🔴 Still down: ${serviceId} (${duration})`,
    title: `"${serviceId}" is still down`,
    intro: `No heartbeat has arrived for ${duration}.`,
    rows: [
      ['Down since', formatLocalTimestamp(detectedAt, timeZone)],
      ['Down for', duration],
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

export function recoveryEmail({ serviceId, downSince, recoveredAt, thresholdMinutes, timeZone }) {
  const downtime = formatDuration(Math.max(0, recoveredAt - downSince));

  const details = [['Recovered at (UTC)', formatUtcTimestamp(recoveredAt)]];
  if (thresholdMinutes) {
    details.unshift(['Alert threshold', thresholdLabel(thresholdMinutes)]);
  }

  return baseLayout({
    status: 'recovered',
    statusLabel: 'Service Recovered',
    subject: `🟢 Back online: ${serviceId} (was down ${downtime})`,
    title: `"${serviceId}" is back online`,
    intro: `Heartbeats from "${serviceId}" have resumed.`,
    rows: [
      ['Down since', formatLocalTimestamp(downSince, timeZone)],
      ['Back at', formatLocalTimestamp(recoveredAt, timeZone)],
      ['Total downtime', downtime],
    ],
    details,
    caption: timeZoneCaption(timeZone),
    footer: 'Generated automatically by the Heartbeat Alert Service. No action required.',
  });
}
