/**
 * Cricket 360 - Multer Upload Middleware
 */

import multer from 'multer';
import { Request } from 'express';
import { UPLOAD_CONFIG } from '@/config/constants';
import { BadRequestError } from '@/utils/errors';

// Configure multer to use memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is allowed
  if (UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`
      )
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, // 5MB
  },
  fileFilter,
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: Request, res: any, next: any) => {
    const uploadMiddleware = upload.single(fieldName);
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new BadRequestError(
              `File too large. Maximum size: ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
            )
          );
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }
      if (!req.file) {
        return next(new BadRequestError('No file uploaded'));
      }
      next();
    });
  };
};
