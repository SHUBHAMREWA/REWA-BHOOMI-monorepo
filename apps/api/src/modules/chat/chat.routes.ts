import { Router } from 'express';
import { 
  listConversations, 
  getMessages, 
  sendMessage, 
  getOrCreateConversation, 
  toggleReaction, 
  markAsRead, 
  toggleConversationApproval, 
  getChatSettings, 
  updateChatSettings 
} from './chat.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/settings', asyncHandler(getChatSettings));
router.post('/settings', asyncHandler(updateChatSettings));
router.get('/', asyncHandler(listConversations));
router.post('/', asyncHandler(getOrCreateConversation));
router.get('/:conversationId/messages', asyncHandler(getMessages));
router.post('/:conversationId/messages', asyncHandler(sendMessage));
router.post('/:conversationId/read', asyncHandler(markAsRead));
router.post('/:conversationId/approval', asyncHandler(toggleConversationApproval));
router.post('/:conversationId/messages/:messageId/reaction', asyncHandler(toggleReaction));

export default router;
