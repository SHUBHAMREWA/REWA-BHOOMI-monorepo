import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
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
