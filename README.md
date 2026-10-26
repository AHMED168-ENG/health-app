# Heartbeat Alert Service

Receives heartbeat requests from an external backend (e.g. rcm-api's cron job
pings it every N minutes) and sends alert emails when a heartbeat stops arriving.

## How it works

1. The monitored backend POSTs `/api/v1/heartbeats/{serviceId}` with an `X-API-Key` header on its schedule.
2. A cron cycle (`CHECK_CRON`) checks every tracked service. Silence longer than
   `DOWN_AFTER_MINUTES` marks the service **down** and emails an alert
   (plus periodic reminders if `REMINDER_EVERY_MINUTES > 0`).
3. When heartbeats resume, the next request marks it **recovered** and emails a resolution notice.

## Endpoints

| Method | Path                     | Auth        | Purpose                             |
|--------|--------------------------|-------------|-------------------------------------|
| GET    | `/health`                | none        | Liveness probe                      |
| POST   | `/api/v1/heartbeats/:id` | `X-API-Key` | Record a heartbeat for service `id` |

## Configuration

Copy `.env.example` to `.env` and fill it in. SMTP credentials come from the
`rcm.conf` table of `billing/rcm-api` (keys `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM_EMAIL`).

| Variable                 | Meaning                                           |
|--------------------------|---------------------------------------------------|
| `HEARTBEAT_API_KEY`      | Shared secret required in `X-API-Key`             |
| `CHECK_CRON`             | Cron expression for the outage check cycle        |
| `DOWN_AFTER_MINUTES`     | Silence tolerance before declaring a service down |
| `REMINDER_EVERY_MINUTES` | Repeat downtime alerts every N minutes (0 = once) |
| `ALERT_EMAIL_RECIPIENTS` | Comma-separated recipient list                    |
| `SMTP_*`                 | Nodemailer transport settings                     |

## Run

```bash
npm install
npm start     # reads .env via dotenv
npm test      # unit tests
```

## Layout

```
src/
  server.js                                startup + cron cycle
  app.js                                   Express wiring + X-API-Key check
  config/env.js                            reads and validates .env
  routes/heartbeatRoutes.js                POST /api/v1/heartbeats/:serviceId
  controllers/heartbeatController.js       request handling -> heartbeat service
  services/heartbeatService.js             down/recovery state machine (time passed in — testable)
  services/alertService.js                 event -> which email to send
  services/email/                          nodemailer sender + HTML template per email type
```

Deploy anywhere: one Node process, state is in-memory (a restart forgets tracked
services until the next heartbeat arrives).

## Example caller (cron on the monitored backend)

```bash
curl -fsS -X POST https://your-host/api/v1/heartbeats/rcm-api \
  -H "X-API-Key: $HEARTBEAT_API_KEY"
```
