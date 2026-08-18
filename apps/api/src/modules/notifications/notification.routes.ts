import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead } from './notification.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listNotifications));
router.patch('/mark-all-read', asyncHandler(markAllAsRead));
router.patch('/:id/read', asyncHandler(markAsRead));

export default router;
