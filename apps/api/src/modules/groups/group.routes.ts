import { Router } from 'express';
import { listGroups, createGroup, getGroupDetails } from './group.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listGroups));
router.post('/', asyncHandler(createGroup));
router.get('/:groupId', asyncHandler(getGroupDetails));

export default router;
