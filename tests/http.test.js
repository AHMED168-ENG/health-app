import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import createApp from '../src/app.js';

const API_KEY = 'test-secret-key';
process.env.HEARTBEAT_API_KEY = API_KEY;

const app = createApp();

test('health endpoint is public', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
});

test('heartbeat without API key is rejected', async () => {
  const res = await request(app).post('/api/v1/heartbeats/rcm-api');
  assert.equal(res.status, 401);
});

test('valid heartbeat is accepted', async () => {
  const res = await request(app)
    .post('/api/v1/heartbeats/http-test-service')
    .set('X-API-Key', API_KEY);
  assert.equal(res.status, 202);
  assert.equal(res.body.serviceId, 'http-test-service');
  assert.equal(res.body.event, 'first_seen');
});

test('invalid service id is rejected', async () => {
  const res = await request(app)
    .post('/api/v1/heartbeats/%20bad id')
    .set('X-API-Key', API_KEY);
  assert.equal(res.status, 400);
});

test('unknown route returns 404', async () => {
  const res = await request(app).get('/nope');
  assert.equal(res.status, 404);
});
