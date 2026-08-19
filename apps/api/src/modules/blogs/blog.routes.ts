import { Router } from 'express';
import {
  listBlogs,
  getBlogDetails,
  createBlog,
  updateBlog,
  deleteBlog,
  // Categories
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  // Tags
  listBlogTags,
  createBlogTag,
  deleteBlogTag,
  // FAQs
  listBlogFaqs,
  addBlogFaq,
  updateBlogFaq,
  deleteBlogFaq,
  reorderBlogFaqs,
} from './blog.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/', asyncHandler(listBlogs));
router.get('/categories', asyncHandler(listBlogCategories));
router.get('/tags', asyncHandler(listBlogTags));
router.get('/:slug', asyncHandler(getBlogDetails));
router.get('/:id/faqs', asyncHandler(listBlogFaqs));

// ─── Admin routes ──────────────────────────────────────────────────────────────
const adminMiddleware = [authenticate, requireRole('ADMIN', 'SUPER_ADMIN')];

// Blog CRUD
router.post('/', ...adminMiddleware, asyncHandler(createBlog));
router.patch('/:id', ...adminMiddleware, asyncHandler(updateBlog));
router.delete('/:id', ...adminMiddleware, asyncHandler(deleteBlog));

// Categories
router.post('/categories', ...adminMiddleware, asyncHandler(createBlogCategory));
router.patch('/categories/:id', ...adminMiddleware, asyncHandler(updateBlogCategory));
router.delete('/categories/:id', ...adminMiddleware, asyncHandler(deleteBlogCategory));

// Tags
router.post('/tags', ...adminMiddleware, asyncHandler(createBlogTag));
router.delete('/tags/:id', ...adminMiddleware, asyncHandler(deleteBlogTag));

// FAQs
router.post('/:id/faqs', ...adminMiddleware, asyncHandler(addBlogFaq));
router.patch('/:id/faqs/reorder', ...adminMiddleware, asyncHandler(reorderBlogFaqs));
router.patch('/:id/faqs/:faqId', ...adminMiddleware, asyncHandler(updateBlogFaq));
router.delete('/:id/faqs/:faqId', ...adminMiddleware, asyncHandler(deleteBlogFaq));

export default router;
