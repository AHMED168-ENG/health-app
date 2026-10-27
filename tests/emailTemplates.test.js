import test from 'node:test';
import assert from 'node:assert/strict';
import { downtimeEmail, downtimeReminderEmail, recoveryEmail } from '../src/services/email/templates/downtime.js';
import { formatDuration } from '../src/services/email/templates/format.js';

const at = (iso) => Date.parse(iso);
const data = {
  serviceId: 'rcm-api',
  lastHeartbeatAt: at('2026-10-26T10:00:00Z'),
  detectedAt: at('2026-10-26T10:05:00Z'),
  now: at('2026-10-26T10:40:00Z'),
  thresholdMinutes: 5,
  timeZone: 'Asia/Riyadh',
};

test('downtime email shows who is down and for how long', () => {
  const { subject, html, text } = downtimeEmail(data);

  assert.match(subject, /rcm-api/);
  assert.match(html, /Service Down/);
  assert.match(html, /Down for/);
  assert.match(text, /Last seen/);
});

test('downtime email keeps raw UTC values in the technical details', () => {
  const { html } = downtimeEmail(data);

  assert.match(html, /Technical details/);
  assert.match(html, /2026-10-26 10:00:00 UTC/);
  assert.doesNotMatch(html, /Outage started at/);
});

test('timestamps are shown in the configured timezone', () => {
  const { html } = downtimeEmail(data);

  assert.match(html, /Mon 26 Oct, 1:00 PM/);
  assert.match(html, /Asia\/Riyadh/);
});

test('reminder email shows the ongoing duration in plain words', () => {
  const { subject, html } = downtimeReminderEmail(data);

  assert.match(subject, /Still down/);
  assert.match(subject, /35 minutes/);
  assert.match(html, /35 minutes/);
});

test('recovery email shows total downtime in plain words', () => {
  const { subject, html } = recoveryEmail({
    serviceId: 'rcm-api',
    downSince: data.detectedAt,
    recoveredAt: at('2026-10-26T10:12:00Z'),
    thresholdMinutes: 5,
    timeZone: 'Asia/Riyadh',
  });

  assert.match(subject, /Back online/);
  assert.match(html, /7 minutes/);
});

test('duration formatter reads like a human', () => {
  assert.equal(formatDuration(0), '0 minutes');
  assert.equal(formatDuration(60_000), '1 minute');
  assert.equal(formatDuration(35 * 60_000), '35 minutes');
  assert.equal(formatDuration(60 * 60_000), '1 hour');
  assert.equal(formatDuration(80 * 60_000), '1 hour 20 minutes');
  assert.equal(formatDuration(50 * 60 * 60_000), '2 days 2 hours');
});

test('emails escape injected service ids', () => {
  const { html } = downtimeEmail({ ...data, serviceId: '<script>evil()</script>' });
  assert.doesNotMatch(html, /<script>/);
});

test('an unknown timezone falls back to UTC instead of throwing', () => {
  const { html } = downtimeEmail({ ...data, timeZone: 'Mars/Olympus' });
  assert.match(html, /2026-10-26 10:00:00 UTC/);
});
