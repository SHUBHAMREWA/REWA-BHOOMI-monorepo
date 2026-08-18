import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
} from '@rewa-bhoomi/validation';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMe,
  updateProfileHandler,
  googleAuth,
  checkUsernameHandler,
} from './auth.controller';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts.' } },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Try again in 1 hour.' } },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/register', registerLimiter, validate(RegisterSchema), register);
router.post('/login', loginLimiter, validate(LoginSchema), login);
router.post('/google', googleAuth);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/forgot-password', forgotPasswordLimiter, validate(ForgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', validate(ResetPasswordSchema), resetPasswordHandler);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(UpdateProfileSchema), updateProfileHandler);
router.get('/check-username/:username', authenticate, checkUsernameHandler);

export default router;
