import { CompressService } from "./compress.service";
import { imageSize } from 'image-size';
import sharp from 'sharp';
import path from 'path';

/**
 * Longest edge kept after processing. Bounds the decoded raster so a large lossless upload
 * (a 25MB PNG can carry hundreds of megapixels) cannot exhaust memory, and stays under WebP's
 * hard 16383px per-side limit. Comfortably above any size the site actually displays.
 */
const MAX_IMAGE_EDGE_PX = 4000;

/** Quality is clamped rather than rejected so callers can pass raw arithmetic results. */
const clampQuality = (quality: number): number =>
    quality > 100 ? 100 : quality < 10 ? 10 : quality;

export class SharpCompressService extends CompressService {

    /**
     * Optimizes an image file to WebP format with specified quality and size constraints.
     * @param file - The uploaded image file to optimize
     * @param targetSize - Target file size in bytes. Minimum enforced is 50KB.
     * @param quality - Quality level for the WebP output (0-100), defaults to 90
     * @returns The optimized image with filename, size (in bytes), and buffer
     */
    public async optimizeImageToWebp(
        file: Express.Multer.File,
        targetSize: number,
        quality: number = 90,
      ): Promise<{ filename: string; size: number; buffer: Buffer }> {
        if (!file.buffer) {
          throw new Error('File buffer is required for image processing. Ensure multer is using memory storage.');
        }

        const originalName = path.parse(file.originalname).name;
        const webpFilename = `${originalName}.webp`;

        // Non-images are never processed here — multer's fileFilter should have rejected them.
        if (!file.mimetype.startsWith('image/')) {
          return {
            filename: file.originalname,
            size: file.buffer.length,
            buffer: file.buffer,
          };
        }

        //avoid min of 100KB
        const _targetSize = targetSize < 100 * 1024 ? 50 * 1024 : targetSize;

        // A single decode of the original, bounded and ALWAYS re-encoded to WebP — including when
        // the source is already under the target. Callers store this under a `.webp` key whose
        // ContentType is derived from the extension, so handing back the source bytes would serve
        // e.g. PNG data labelled `image/webp`, which downstream consumers (the moderation vision
        // model reads the stored thumbnail by URL) reject outright.
        let buffer = await sharp(file.buffer)
          .resize({
            width: MAX_IMAGE_EDGE_PX,
            height: MAX_IMAGE_EDGE_PX,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: clampQuality(quality) })
          .toBuffer();

        //reduce the image size by 10% each time, lowering quality alongside it
        const reduce = 0.9;
        let currentQuality = clampQuality(quality);
        for (let loops = 0; buffer.length > _targetSize && loops < 5; loops++) {
          const { width, height } = imageSize(buffer);
          if (!width || !height) break;
          currentQuality = clampQuality(currentQuality - 5);
          buffer = await sharp(buffer)
            .resize({
              width: Math.floor(width * reduce),
              height: Math.floor(height * reduce),
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: currentQuality })
            .toBuffer();
        }

        return {
          filename: webpFilename,
          size: buffer.length,
          buffer,
        };
      }
}