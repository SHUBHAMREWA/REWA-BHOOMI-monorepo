import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

function createTransporter(port = env.SMTP_PORT, secure = env.SMTP_SECURE) {
  const isGmail = env.SMTP_HOST.includes('gmail') || env.SMTP_USER?.includes('@gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  const isPort465 = port === 465;
  const isSecure = secure || isPort465;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

let transporter = createTransporter();

// Fallback transporter (port 465 SSL) if primary is on custom host
const fallbackTransporter = !env.SMTP_HOST.includes('gmail') && !env.SMTP_USER?.includes('@gmail.com') && env.SMTP_PORT !== 465
  ? createTransporter(465, true)
  : null;

function getFromAddress() {
  if (env.SMTP_FROM && !env.SMTP_FROM.includes('noreply@rewabhoomi.com')) {
    return env.SMTP_FROM;
  }
  return `"Rewa Bhoomi" <${env.SMTP_USER}>`;
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  // 1. Resend HTTPS API (Recommended on Render Free tier - uses port 443 HTTPS)
  if (env.RESEND_API_KEY) {
    try {
      const from = env.SMTP_FROM || 'Rewa Bhoomi <noreply@rewabhoomi.com>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        const errorMsg = data.message || data.error?.message || 'Resend API rejected the email';
        throw new Error(errorMsg);
      }
      logger.info(`📧 Email sent via Resend API: ${data.id}`);
      return data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to send email via Resend API');
      throw error;
    }
  }

  // 2. Brevo HTTPS API (uses port 443 HTTPS)
  if (env.BREVO_API_KEY) {
    try {
      const senderEmail = env.SMTP_USER || 'rewabhoomiofficial@gmail.com';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Rewa Bhoomi', email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(data.message || 'Brevo API failed to send email');
      }
      logger.info(`📧 Email sent via Brevo API: ${data.messageId}`);
      return data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to send email via Brevo API');
      throw error;
    }
  }

  // 3. SMTP Transport
  const from = getFromAddress();
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error: any) {
    // If primary failed with connection timeout or refused, try fallback
    if (fallbackTransporter && (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED' || error?.command === 'CONN')) {
      logger.warn({ error: error.message }, 'Primary SMTP connection failed, attempting fallback on port 465 SSL...');
      try {
        const fallbackInfo = await fallbackTransporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        logger.info(`📧 Email sent via fallback: ${fallbackInfo.messageId}`);
        transporter = fallbackTransporter;
        return fallbackInfo;
      } catch (fallbackError) {
        logger.error({ fallbackError }, 'Fallback SMTP also failed to send email');
        throw fallbackError;
      }
    }

    logger.error({ error }, 'Failed to send email');
    throw error;
  }
};

export const sendOTP = async (to: string, otp: string) => {
  const subject = 'Your Rewa Bhoomi Verification Code';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Rewa Bhoomi Verification</h2>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="font-size: 36px; letter-spacing: 5px; color: #1B4FD8;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendPasswordReset = async (to: string, resetLink: string) => {
  const subject = 'Reset Your Rewa Bhoomi Password';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1B4FD8; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Reset Password</a>
      <p style="margin-top: 30px; font-size: 14px; color: #666;">This link will expire in 15 minutes.</p>
      <p style="font-size: 12px; color: #999;">If the button doesn't work, copy and paste this URL into your browser: ${resetLink}</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to Rewa Bhoomi!';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining Rewa Bhoomi, your trusted real estate platform in Rewa.</p>
      <p>We are excited to have you on board. You can now explore properties, post your own listings, and connect with buyers and sellers.</p>
      <a href="${env.APP_URL}" style="display: inline-block; padding: 12px 24px; background-color: #1B4FD8; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Explore Rewa Bhoomi</a>
      <p style="margin-top: 30px; font-size: 14px; color: #666;">If you have any questions, feel free to reach out to our support team.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendLoginAlertEmail = async (to: string, name: string, ip: string, time: string, deviceRegion: string = 'Unknown') => {
  const subject = 'New Login Alert - Rewa Bhoomi';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hello ${name},</h2>
      <p>We detected a new login to your Rewa Bhoomi account.</p>
      <ul>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Region/Device:</strong> ${deviceRegion}</li>
      </ul>
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you didn't log in, please reset your password immediately and contact support to secure your account.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};
