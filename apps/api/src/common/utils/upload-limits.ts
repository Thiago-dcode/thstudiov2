import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MAX_IMAGE_UPLOAD_BYTES } from '@repo/common-lib/constants/limits';

/**
 * Multer options for the multipart image routes (avatar/banner, thumbnails, about photo).
 *
 * Multer buffers these in API memory before any DTO, ownership or size check runs, and with
 * no `limits` a single authenticated request could hold the whole nginx body cap (520 MB)
 * per replica. Cap each file at the same size the upload flow already allows for images.
 */
export const IMAGE_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES, files: 2 },
};
