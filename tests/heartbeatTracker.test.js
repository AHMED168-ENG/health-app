import test from 'node:test';
import assert from 'node:assert/strict';
import { HeartbeatTracker } from '../src/services/heartbeatService.js';

const MINUTE = 60_000;

function createTracker(overrides = {}) {
  return new HeartbeatTracker({
    downAfterMs: 5 * MINUTE,
    reminderEveryMs: 30 * MINUTE,
    ...overrides,
  });
}

test('first heartbeat is recorded without events', () => {
  const tracker = createTracker();
  assert.equal(tracker.record('rcm-api', 0).event, 'first_seen');
  assert.deepEqual(tracker.detectOutages(4 * MINUTE), []);
});

test('service is flagged down after the threshold passes', () => {
  const tracker = createTracker();
  tracker.record('rcm-api', 0);

  assert.deepEqual(tracker.detectOutages(4 * MINUTE), []);

  const events = tracker.detectOutages(6 * MINUTE);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'down');
  assert.equal(events[0].serviceId, 'rcm-api');
});

test('down alert fires once; reminders follow the reminder interval', () => {
  const tracker = createTracker();
  tracker.record('rcm-api', 0);
  assert.equal(tracker.detectOutages(6 * MINUTE).length, 1);

  assert.deepEqual(tracker.detectOutages(16 * MINUTE), [], 'no duplicate alert before reminder is due');

  const events = tracker.detectOutages(41 * MINUTE);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'down_reminder');
});

test('reminder disabled when reminderEveryMs is 0', () => {
  const tracker = createTracker({ reminderEveryMs: 0 });
  tracker.record('rcm-api', 0);
  assert.equal(tracker.detectOutages(6 * MINUTE).length, 1);
  assert.deepEqual(tracker.detectOutages(200 * MINUTE), []);
});

test('heartbeat after an outage emits a recovery event', () => {
  const tracker = createTracker();
  tracker.record('rcm-api', 0);
  tracker.detectOutages(6 * MINUTE);

  const result = tracker.record('rcm-api', 10 * MINUTE);
  assert.equal(result.event, 'recovered');
  assert.ok(result.downSince <= result.lastHeartbeatAt);
});

test('recovered service can go down again', () => {
  const tracker = createTracker();
  tracker.record('rcm-api', 0);
  tracker.detectOutages(6 * MINUTE);
  tracker.record('rcm-api', 7 * MINUTE);

  const events = tracker.detectOutages(13 * MINUTE);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'down');
});

test('services are tracked independently', () => {
  const tracker = createTracker();
  tracker.record('a', 0);
  tracker.record('b', 6 * MINUTE);

  const events = tracker.detectOutages(7 * MINUTE);
  assert.deepEqual(events.map((e) => e.serviceId), ['a']);
});
