import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead, getVapidPublicKey, subscribePush, unsubscribePush } from './notification.controller';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.get('/vapid-key', asyncHandler(getVapidPublicKey));

// Push subscription can be done by guests (PWA installed / non-logged-in users) or logged-in users
router.post('/subscribe', optionalAuth, asyncHandler(subscribePush));
router.post('/unsubscribe', asyncHandler(unsubscribePush));

router.use(authenticate);

router.get('/', asyncHandler(listNotifications));
router.patch('/mark-all-read', asyncHandler(markAllAsRead));
router.patch('/:id/read', asyncHandler(markAsRead));

export default router;

