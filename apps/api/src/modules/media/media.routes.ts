import { Router } from 'express';
import multer from 'multer';
import { uploadMediaHandler, deleteMediaHandler } from './media.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

router.post('/upload', authenticate, upload.single('file'), asyncHandler(uploadMediaHandler));
router.post('/delete', authenticate, asyncHandler(deleteMediaHandler));

export default router;
