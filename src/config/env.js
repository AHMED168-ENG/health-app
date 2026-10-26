import 'dotenv/config';
import Joi from 'joi';
import { validate as validateCron } from 'node-cron';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info').default('info'),

  HEARTBEAT_API_KEY: Joi.string().min(8).required(),

  CHECK_CRON: Joi.string().custom((value) => {
    if (!validateCron(value)) {
      throw new Error('CHECK_CRON is not a valid cron expression');
    }
    return value;
  }).default('* * * * *'),
  DOWN_AFTER_MINUTES: Joi.number().integer().min(1).default(5),
  REMINDER_EVERY_MINUTES: Joi.number().integer().min(0).default(0),

  ALERT_EMAIL_RECIPIENTS: Joi.string().required(),
  ALERT_EMAIL_REPLY_TO: Joi.string().email().allow('').default(''),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().allow('').required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
}).unknown(true);

const { error, value } = schema.validate(process.env, { abortEarly: false });
if (error) {
  throw new Error(`Invalid environment configuration:\n  - ${error.message.split('. ').join('\n  - ')}`);
}

function parseRecipients(raw) {
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

const env = {
  port: value.PORT,
  logLevel: value.LOG_LEVEL,

  checkCron: value.CHECK_CRON,
  downAfterMinutes: value.DOWN_AFTER_MINUTES,
  reminderEveryMinutes: value.REMINDER_EVERY_MINUTES,

  alertRecipients: parseRecipients(value.ALERT_EMAIL_RECIPIENTS),
  alertReplyTo: value.ALERT_EMAIL_REPLY_TO || undefined,

  smtp: {
    host: value.SMTP_HOST,
    port: value.SMTP_PORT,
    secure: value.SMTP_SECURE,
    user: value.SMTP_USER,
    pass: value.SMTP_PASS,
    fromEmail: value.SMTP_FROM_EMAIL,
  },
};

export default env;
