import { Router } from 'express';
import { listConversations, getMessages, sendMessage } from './chat.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listConversations));
router.get('/:conversationId/messages', asyncHandler(getMessages));
router.post('/:conversationId/messages', asyncHandler(sendMessage));

export default router;
