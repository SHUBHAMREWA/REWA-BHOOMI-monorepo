import { Router } from 'express';
import {
  getCompanyCommunication,
  updateCompanyCommunication,
} from './communication.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', asyncHandler(getCompanyCommunication));

// ─── Admin Only ───────────────────────────────────────────────────────────────
router.put(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(updateCompanyCommunication)
);
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(updateCompanyCommunication)
);

export default router;

