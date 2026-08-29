import { Router } from 'express';
import multer from 'multer';
import {
  listActivePosters,
  listAllPostersAdmin,
  createPosterHandler,
  updatePosterHandler,
  deletePosterHandler,
} from './poster.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for posters!'));
    }
  },
});

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/', asyncHandler(listActivePosters));

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(listAllPostersAdmin));
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  asyncHandler(createPosterHandler)
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(updatePosterHandler)
);
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(deletePosterHandler)
);

export default router;
