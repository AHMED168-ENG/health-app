import nodemailer from 'nodemailer';
import env from '../../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

/** Sends `{ subject, text, html }` to all configured recipients. */
export async function sendEmail(message) {
  const info = await transporter.sendMail({
    from: env.smtp.fromEmail,
    to: env.alertRecipients.join(','),
    replyTo: env.alertReplyTo,
    ...message,
  });
  console.log(`Email sent: "${message.subject}" -> ${info.messageId}`);
  return info;
}
