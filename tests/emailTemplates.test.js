import test from 'node:test';
import assert from 'node:assert/strict';
import { downtimeEmail, downtimeReminderEmail, recoveryEmail } from '../src/services/email/templates/downtime.js';

const at = (iso) => Date.parse(iso);
const data = {
  serviceId: 'rcm-api',
  lastHeartbeatAt: at('2026-10-26T10:00:00Z'),
  detectedAt: at('2026-10-26T10:05:00Z'),
  now: at('2026-10-26T10:40:00Z'),
  thresholdMinutes: 5,
};

test('downtime email renders subject, html and text', () => {
  const { subject, html, text } = downtimeEmail(data);
  assert.match(subject, /rcm-api/);
  assert.match(html, /Service Down/);
  assert.match(html, /2026-10-26 10:00:00 UTC/);
  assert.match(text, /Last heartbeat/);
});

test('reminder email shows ongoing duration', () => {
  const { subject, html } = downtimeReminderEmail(data);
  assert.match(subject, /REMINDER/);
  assert.match(html, /35 min/);
});

test('recovery email shows downtime duration', () => {
  const { subject, html } = recoveryEmail({
    serviceId: 'rcm-api',
    downSince: data.detectedAt,
    recoveredAt: at('2026-10-26T10:12:00Z'),
  });
  assert.match(subject, /RESOLVED/);
  assert.match(html, /7 min/);
});

test('emails escape injected service ids', () => {
  const { html } = downtimeEmail({ ...data, serviceId: '<script>evil()</script>' });
  assert.doesNotMatch(html, /<script>/);
});
