import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  ALLOWED_IMAGE_FILE_TYPES,
} from '@repo/common-lib/constants/constants';
import type { MimeTypes } from '@repo/common-lib/types/general';

/** Mirrors the web proxy's limit (`apps/web/src/app/api/media/route.ts`). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Multer options for image uploads.
 *
 * The Next.js proxy route enforced a size + MIME check, but the API accepted anything
 * because `FileInterceptor` was configured with no `limits` and no `fileFilter` — and
 * calling the API directly bypasses the proxy entirely. Without this, a caller could
 * upload `text/html`, which `SharpCompressService` passes through unmodified (it only
 * processes `image/*`) and `S3StorageService` then stores with the client's own
 * `ContentType`, yielding stored XSS served from the CDN domain.
 */
export const imageUploadOptions: MulterOptions = {
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 20,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(file.mimetype as MimeTypes)) {
      return callback(
        new BadRequestException(
          `Unsupported file type "${file.mimetype}". Allowed: ${ALLOWED_IMAGE_FILE_TYPES.join(', ')}.`,
        ),
        false,
      );
    }
    callback(null, true);
  },
};
