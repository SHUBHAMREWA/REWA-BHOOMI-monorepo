import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { query } from '../database/connection';
import type { UserRole } from '@rewa-bhoomi/types';

export interface AuthPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ─── Authenticate ────────────────────────────────────────────────────────────────

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('No access token provided');
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

// ─── Optional Auth (doesn't throw if not authenticated) ──────────────────────────

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
    // silently ignore invalid token for optional auth
  }
  next();
}

// ─── Require Role(s) ─────────────────────────────────────────────────────────────

export function requireRole(...roles: UserRole[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    const user = _req.user;
    if (!user) {
      throw new UnauthorizedError();
    }
    const hasRole = roles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenError(`Access requires one of: ${roles.join(', ')}`);
    }
    next();
  };
}

// ─── Require Resource Ownership or Admin ─────────────────────────────────────────

export function requireOwnerOrAdmin(getOwnerId: (req: Request) => Promise<string | null>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();

    // Admins and Super Admins bypass ownership check
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const ownerId = await getOwnerId(req);
    if (ownerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to modify this resource');
    }
    next();
  };
}

// ─── Generate Tokens ─────────────────────────────────────────────────────────────

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const rows = await query<{ name: UserRole }>(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.name);
}

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}
