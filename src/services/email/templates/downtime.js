import baseLayout from './base.js';

export function formatUtcTimestamp(epochMs) {
  return new Date(epochMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours === 0 ? `${minutes} min` : `${hours} h ${minutes} min`;
}

export function downtimeEmail({ serviceId, lastHeartbeatAt, detectedAt, thresholdMinutes }) {
  return baseLayout({
    status: 'down',
    statusLabel: 'Service Down',
    title: `[ALERT] No heartbeat received from "${serviceId}"`,
    intro:
      `The heartbeat monitor stopped receiving requests from "${serviceId}". ` +
      `No heartbeat has arrived for more than ${thresholdMinutes} minute(s).`,
    rows: [
      ['Service', serviceId],
      ['Last heartbeat', formatUtcTimestamp(lastHeartbeatAt)],
      ['Outage detected at', formatUtcTimestamp(detectedAt)],
      ['Heartbeat threshold', `${thresholdMinutes} min`],
    ],
    note: 'Check the producing backend and its scheduled job as soon as possible.',
    footer: 'Generated automatically by the Heartbeat Alert Service.',
  });
}

export function downtimeReminderEmail({ serviceId, lastHeartbeatAt, detectedAt, now, thresholdMinutes }) {
  return baseLayout({
    status: 'down',
    statusLabel: 'Still Down',
    title: `[REMINDER] "${serviceId}" is still down`,
    intro: `"${serviceId}" has been silent for ${formatDuration(now - detectedAt)} since the outage was first detected.`,
    rows: [
      ['Service', serviceId],
      ['Last heartbeat', formatUtcTimestamp(lastHeartbeatAt)],
      ['Outage started at', formatUtcTimestamp(detectedAt)],
      ['Ongoing for', formatDuration(now - detectedAt)],
      ['Heartbeat threshold', `${thresholdMinutes} min`],
    ],
    note: 'The original downtime alert was already sent. This is a periodic reminder.',
    footer: 'Generated automatically by the Heartbeat Alert Service.',
  });
}

export function recoveryEmail({ serviceId, downSince, recoveredAt }) {
  return baseLayout({
    status: 'recovered',
    statusLabel: 'Service Recovered',
    title: `[RESOLVED] Heartbeats from "${serviceId}" resumed`,
    intro: `"${serviceId}" is sending heartbeats again and has returned to a healthy state.`,
    rows: [
      ['Service', serviceId],
      ['Outage started at', formatUtcTimestamp(downSince)],
      ['Recovered at', formatUtcTimestamp(recoveredAt)],
      ['Total downtime', formatDuration(recoveredAt - downSince)],
    ],
    note: '',
    footer: 'Generated automatically by the Heartbeat Alert Service. No action required.',
  });
}
