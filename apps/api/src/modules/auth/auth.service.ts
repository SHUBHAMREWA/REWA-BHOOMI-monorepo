import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../../database/connection';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { sendWelcomeEmail, sendLoginAlertEmail } from '../../services/email.service';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../errors/AppError';
import {
  generateAccessToken,
  generateRefreshToken,
  getUserRoles,
  verifyRefreshToken,
} from '../../middleware/auth';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@rewa-bhoomi/validation';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_MS,
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
} from '@rewa-bhoomi/config';

// ─── Status Validation ──────────────────────────────────────────────────────

export function checkUserStatus(status: string) {
  if (status === 'ACTIVE') return;
  if (status === 'SUSPENDED') {
    throw new UnauthorizedError('Your account has been temporarily suspended by admin. Please contact support.');
  }
  if (status === 'BLOCKED') {
    throw new UnauthorizedError('Your account has been permanently blocked by admin.');
  }
  if (status === 'PENDING') {
    throw new UnauthorizedError('Your account is pending verification or onboarding.');
  }
  if (status === 'DEACTIVATED') {
    throw new UnauthorizedError('Your account has been deactivated.');
  }
  throw new UnauthorizedError('Account access restricted.');
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const { name, email, phone, password } = input;

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()],
  );
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  return withTransaction(async (client) => {
    // Generate a random username: user_ + 6 hex chars
    const username = `user_${crypto.randomBytes(3).toString('hex')}`;

    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, phone, password_hash, username, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id`,
      [name.trim(), email.toLowerCase(), phone ?? null, passwordHash, username],
    );
    const userId = userResult.rows[0].id;

    // Assign default USER role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'USER'`,
      [userId],
    );

    const roles = await getUserRoles(userId);
    const accessToken = generateAccessToken({ userId, email: email.toLowerCase(), roles });
    const refreshToken = generateRefreshToken({ userId });
    const tokenHash = hashToken(refreshToken);

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, tokenHash],
    );

    logger.info({ userId, email }, 'New user registered');
    
    // Send welcome email asynchronously
    sendWelcomeEmail(email.toLowerCase(), name.trim()).catch((err) => {
      logger.error({ err, email }, 'Failed to send welcome email');
    });

    return { userId, accessToken, refreshToken, roles };
  });
}

// ─── Google Auth ──────────────────────────────────────────────────────────────

export async function authWithGoogle(credential: string, ip?: string) {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const { email, name, sub: googleId, picture: avatarUrl } = payload;

  return withTransaction(async (dbClient) => {
    let user = await dbClient.query(
      `SELECT id, status, name, email FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    let userId: string;
    
    if (user.rows.length > 0) {
      userId = user.rows[0].id;
      checkUserStatus(user.rows[0].status);
      // Link google_id if not linked
      await dbClient.query(`UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS NULL`, [googleId, userId]);
    } else {
      // Generate a random username
      const username = `user_${crypto.randomBytes(3).toString('hex')}`;

      // Register new user
      const userResult = await dbClient.query(
        `INSERT INTO users (name, email, google_id, avatar_url, username, status, email_verified_at)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
         RETURNING id`,
        [name, email.toLowerCase(), googleId, avatarUrl, username]
      );
      userId = userResult.rows[0].id;
      
      await dbClient.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = 'USER'`,
        [userId]
      );
    }

    const roles = await getUserRoles(userId);
    const accessToken = generateAccessToken({ userId, email: email.toLowerCase(), roles });
    const refreshToken = generateRefreshToken({ userId });
    const tokenHash = hashToken(refreshToken);

    await dbClient.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [userId, tokenHash, ip ?? null]
    );

    const userName = name ?? user?.rows[0]?.name ?? 'User';

    if (user.rows.length === 0) {
      // New user signup via Google
      sendWelcomeEmail(email.toLowerCase(), userName).catch(err => {
        logger.error({ err, email }, 'Failed to send welcome email (Google Auth)');
      });
    } else {
      // Existing user login via Google
      const loginTime = new Date().toLocaleString();
      sendLoginAlertEmail(email.toLowerCase(), userName, ip || 'Unknown', loginTime, 'Web Browser').catch(err => {
        logger.error({ err, email }, 'Failed to send login alert email (Google Auth)');
      });
    }

    return {
      userId,
      name: name ?? user?.rows[0]?.name,
      email: email.toLowerCase(),
      roles,
      accessToken,
      refreshToken,
    };
  });
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput, ip?: string) {
  const { email, password } = input;

  const user = await queryOne<{
    id: string;
    email: string;
    password_hash: string | null;
    status: string;
    name: string;
  }>(
    `SELECT id, email, password_hash, status, name
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase()],
  );

  if (!user || !user.password_hash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  checkUserStatus(user.status);

  const isValid = await argon2.verify(user.password_hash, password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const roles = await getUserRoles(user.id);
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, roles });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const tokenHash = hashToken(refreshToken);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
    [user.id, tokenHash, ip ?? null],
  );

  logger.info({ userId: user.id, email: user.email }, 'User logged in');

  const loginTime = new Date().toLocaleString();
  sendLoginAlertEmail(user.email, user.name, ip || 'Unknown', loginTime, 'Web Browser').catch(err => {
    logger.error({ err, email: user.email }, 'Failed to send login alert email');
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    roles,
    accessToken,
    refreshToken,
  };
}

// ─── OTP Login ────────────────────────────────────────────────────────────────

export async function sendLoginOtp(email: string) {
  const user = await queryOne<{ id: string; name: string; status: string }>(
    'SELECT id, name, status FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()]
  );

  if (!user) {
    // Return silently to prevent email enumeration
    logger.info({ email }, 'OTP login attempt for non-existent user');
    return;
  }

  checkUserStatus(user.status);

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous OTPs for this email
  await query(
    'UPDATE user_otps SET used_at = NOW() WHERE email = $1 AND used_at IS NULL',
    [email.toLowerCase()]
  );

  await query(
    'INSERT INTO user_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email.toLowerCase(), otp, expiresAt]
  );

  const { sendOTP } = await import('../../services/email.service');
  await sendOTP(email.toLowerCase(), otp);
  logger.info({ userId: user.id }, 'Login OTP sent');
}

export async function verifyLoginOtp(input: { email: string; otp: string }, ip?: string) {
  const { email, otp } = input;

  const record = await queryOne<{ id: string; email: string; used_at: string | null }>(
    `SELECT id, email, used_at FROM user_otps
     WHERE email = $1 AND otp = $2 AND expires_at > NOW()`,
    [email.toLowerCase(), otp]
  );

  if (!record || record.used_at) {
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  const user = await queryOne<{
    id: string;
    email: string;
    status: string;
    name: string;
  }>(
    `SELECT id, email, status, name
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase()]
  );

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  checkUserStatus(user.status);

  await withTransaction(async (client) => {
    // Mark OTP as used
    await client.query('UPDATE user_otps SET used_at = NOW() WHERE id = $1', [record.id]);
  });

  const roles = await getUserRoles(user.id);
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, roles });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const tokenHash = hashToken(refreshToken);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
    [user.id, tokenHash, ip ?? null]
  );

  logger.info({ userId: user.id, email: user.email }, 'User logged in via OTP');

  const loginTime = new Date().toLocaleString();
  sendLoginAlertEmail(user.email, user.name, ip || 'Unknown', loginTime, 'Web Browser').catch(err => {
    logger.error({ err, email: user.email }, 'Failed to send login alert email');
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    roles,
    accessToken,
    refreshToken,
  };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const stored = await queryOne<{ id: string; user_id: string; revoked_at: string | null }>(
    `SELECT id, user_id, revoked_at FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash],
  );

  if (!stored || stored.revoked_at) {
    throw new UnauthorizedError('Invalid or revoked refresh token');
  }

  // Rotate the refresh token
  const newRefreshToken = generateRefreshToken({ userId: payload.userId });
  const newTokenHash = hashToken(newRefreshToken);

  await withTransaction(async (client) => {
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [stored.id],
    );
    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [stored.user_id, newTokenHash],
    );
  });

  const user = await queryOne<{ id: string; email: string; status: string }>(
    'SELECT id, email, status FROM users WHERE id = $1',
    [stored.user_id],
  );
  if (!user) throw new UnauthorizedError();
  checkUserStatus(user.status);

  const roles = await getUserRoles(user.id);
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, roles });

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Logout ─────────────────────────────────────────────────────────────────────

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
    [tokenHash],
  );
}

export async function logoutAllDevices(userId: string) {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId],
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(input: ForgotPasswordInput) {
  const { email } = input;

  const user = await queryOne<{ id: string; name: string; email: string }>(
    'SELECT id, name, email FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()],
  );

  // Always respond success to prevent email enumeration
  if (!user) {
    logger.info({ email }, 'Forgot password - email not found (silent)');
    return;
  }

  // Invalidate old tokens
  await query(
    'UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [user.id],
  );

  // Generate secure token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt],
  );

  const resetLink = `${env.APP_URL}/auth/reset-password?token=${rawToken}`;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: user.email,
      subject: 'Reset your Rewa Bhoomi password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to create a new password.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}"
               style="background: #1a56db; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            Rewa Bhoomi · Rewa, Madhya Pradesh
          </p>
        </div>
      `,
    });
    logger.info({ userId: user.id }, 'Password reset email sent');
  } catch (err) {
    logger.error({ err, userId: user.id }, 'Failed to send password reset email');
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const rawToken = input.token;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await queryOne<{ id: string; user_id: string; used_at: string | null }>(
    `SELECT id, user_id, used_at FROM password_resets
     WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash],
  );

  if (!record || record.used_at) {
    throw new BadRequestError('Invalid or expired password reset link');
  }

  const newHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newHash,
      record.user_id,
    ]);
    await client.query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = $1',
      [record.id],
    );
    // Revoke all sessions
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [record.user_id],
    );
  });

  logger.info({ userId: record.user_id }, 'Password reset successfully');
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Profile Update ────────────────────────────────────────────────────────────

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const { name, phone, avatar_url, username, bio } = input;
  
  // Construct dynamic query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (username !== undefined) {
    if (username !== null) {
      // Check if username is taken by another user
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (existing) {
        throw new ConflictError('Username is already taken');
      }
    }
    updates.push(`username = $${paramIdx++}`);
    values.push(username);
  }

  if (bio !== undefined) {
    updates.push(`bio = $${paramIdx++}`);
    values.push(bio);
  }

  if (name !== undefined) {
    updates.push(`name = $${paramIdx++}`);
    values.push(name);
  }
  
  if (phone !== undefined) {
    updates.push(`phone = $${paramIdx++}`);
    values.push(phone);
  }
  
  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIdx++}`);
    values.push(avatar_url);
  }

  if (updates.length === 0) {
    return; // Nothing to update
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const sql = `
    UPDATE users 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIdx} AND deleted_at IS NULL
    RETURNING id, name, email, phone, avatar_url, username, bio, status, created_at
  `;

  const updatedUser = await queryOne(sql, values);
  if (!updatedUser) {
    throw new NotFoundError('User not found');
  }

  return updatedUser;
}
