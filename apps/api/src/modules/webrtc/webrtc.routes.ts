import { Router } from 'express';
import { initiateCall, updateCallStatus } from './webrtc.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.post('/call', asyncHandler(initiateCall));
router.patch('/call/:callId', asyncHandler(updateCallStatus));

export default router;
