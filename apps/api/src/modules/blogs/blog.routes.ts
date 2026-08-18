import { Router } from 'express';
import { listBlogs, getBlogDetails, createBlog, updateBlog, deleteBlog } from './blog.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', asyncHandler(listBlogs));
router.get('/:slug', asyncHandler(getBlogDetails));

// Admin routes
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(createBlog));
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(updateBlog));
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(deleteBlog));

export default router;
