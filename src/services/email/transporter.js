import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import { logger } from '../../config/logger.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

/** Sends `{ subject, text, html }` to all configured recipients. */
export async function sendEmail(message) {
  try {
    const info = await transporter.sendMail({
      from: env.smtp.fromEmail,
      to: env.alertRecipients.join(','),
      replyTo: env.alertReplyTo,
      ...message,
    });
    logger.info('Email sent', { subject: message.subject, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Email send FAILED', { subject: message.subject, error: error.message });
    throw error;
  }
}
