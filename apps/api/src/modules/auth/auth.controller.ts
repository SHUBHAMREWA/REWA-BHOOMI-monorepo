import { Request, Response } from 'express';
import { asyncHandler, successResponse } from '../../middleware/errorHandler';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  updateProfile,
  authWithGoogle,
} from './auth.service';
import { REFRESH_TOKEN_EXPIRY_MS } from '@rewa-bhoomi/config';

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/',
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { userId, accessToken, refreshToken, roles } = await registerUser(req.body);

  res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

  return successResponse(
    res,
    { userId, roles, accessToken },
    'Account created successfully',
    201,
  );
});

// ─── Login ─────────────────────────────────────────────────────────────────────

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip ?? req.headers['x-forwarded-for']?.toString();
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, error: { message: 'Google credential is required' } });
  }

  const result = await authWithGoogle(credential, ip);

  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  return successResponse(res, {
    userId:  result.userId,
    name:    result.name,
    email:   result.email,
    roles:   result.roles,
    accessToken: result.accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip ?? req.headers['x-forwarded-for']?.toString();
  const result = await loginUser(req.body, ip);

  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  return successResponse(res, {
    userId:  result.userId,
    name:    result.name,
    email:   result.email,
    roles:   result.roles,
    accessToken: result.accessToken,
  });
});

// ─── OTP Login ────────────────────────────────────────────────────────────────

export const sendLoginOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sendLoginOtp } = await import('./auth.service');
  await sendLoginOtp(req.body.email);
  return successResponse(res, null, 'If your email is registered, an OTP has been sent.');
});

export const verifyLoginOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { verifyLoginOtp } = await import('./auth.service');
  const ip = req.ip ?? req.headers['x-forwarded-for']?.toString();
  const result = await verifyLoginOtp(req.body, ip);

  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  return successResponse(res, {
    userId:  result.userId,
    name:    result.name,
    email:   result.email,
    roles:   result.roles,
    accessToken: result.accessToken,
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
    });
  }

  const { accessToken, refreshToken } = await refreshAccessToken(token);

  res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
  return successResponse(res, { accessToken });
});

// ─── Logout ─────────────────────────────────────────────────────────────────────

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) await logoutUser(token);

  const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie(COOKIE_NAME, clearOptions);
  return successResponse(res, null, 'Logged out successfully');
});

// ─── Logout All Devices ───────────────────────────────────────────────────────

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await logoutAllDevices(req.user!.userId);
  const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie(COOKIE_NAME, clearOptions);
  return successResponse(res, null, 'Logged out from all devices');
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await forgotPassword(req.body);
  return successResponse(
    res,
    null,
    'If your email is registered, you will receive a reset link shortly',
  );
});

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body);
  return successResponse(res, null, 'Password reset successfully. Please log in again.');
});

// ─── Get Current User ─────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { queryOne } = await import('../../database/connection');
  const { getUserRoles } = await import('../../middleware/auth');
  
  const user = await queryOne<{
    id: string; name: string; email: string; phone: string | null;
    avatar_url: string | null; username: string | null; bio: string | null; status: string; created_at: string;
  }>(
    `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.username, u.bio, u.status, u.created_at
     FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [req.user!.userId],
  );

  const latestRoles = await getUserRoles(req.user!.userId);

  return successResponse(res, {
    ...user,
    roles: latestRoles,
  });
});

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const updatedUser = await updateProfile(req.user!.userId, req.body);
  
  return successResponse(res, {
    ...updatedUser,
    roles: req.user!.roles,
  }, 'Profile updated successfully');
});

// ─── Check Username ───────────────────────────────────────────────────────────

export const checkUsernameHandler = asyncHandler(async (req: Request, res: Response) => {
  const cleanUsername = req.params.username.trim().toLowerCase();
  const { queryOne } = await import('../../database/connection');
  
  const existing = await queryOne(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
    [cleanUsername]
  );
  
  return successResponse(res, { available: !existing });
});
