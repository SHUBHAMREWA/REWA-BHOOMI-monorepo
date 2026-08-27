import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead, getVapidPublicKey, subscribePush, unsubscribePush } from './notification.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.get('/vapid-key', asyncHandler(getVapidPublicKey));

router.use(authenticate);

router.get('/', asyncHandler(listNotifications));
router.patch('/mark-all-read', asyncHandler(markAllAsRead));
router.patch('/:id/read', asyncHandler(markAsRead));

router.post('/subscribe', asyncHandler(subscribePush));
router.post('/unsubscribe', asyncHandler(unsubscribePush));

export default router;

