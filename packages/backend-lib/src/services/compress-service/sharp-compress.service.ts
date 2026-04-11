import { CompressService } from "./compress.service";
import { imageSize } from 'image-size';
import sharp from 'sharp';
import path from 'path';

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

        //avoid min of 100KB
        const _targetSize = targetSize < 100 * 1024 ? 50 * 1024 : targetSize;
        if (!file.mimetype.startsWith('image/') || file.size < _targetSize) {
          return {
            filename: file.originalname,
            size: file.buffer.length,
            buffer: file.buffer,
          };
        }
    
        const optimizeRecursively = async (
          buffer: Buffer,
          quality: number,
          targetSize: number,
          loops = 0,
        ): Promise<Buffer> => {
          const { width, height } = imageSize(buffer);
          //avoid quality out of range
          const _quality = quality > 100 ? 100 : quality < 10 ? 10 : quality;
          //reduce the image size by 10% each time
          const reduce = 0.9;
          const targetWidth = Math.floor(width * reduce);
          const targetHeight = Math.floor(height * reduce);
          const optimizedBuffer = await sharp(file.buffer)
            .resize({
              width: targetWidth,
              height: targetHeight,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: _quality })
            .toBuffer();
    
          if (optimizedBuffer.length <= targetSize || loops >= 5)
            return optimizedBuffer;
          
          return await optimizeRecursively(
            optimizedBuffer,
            _quality - 5,
            targetSize,
            loops + 1,
          );
        };

        const buffer = await optimizeRecursively(file.buffer, quality, _targetSize);
        return {
          filename: webpFilename,
          size: buffer.length,
          buffer,
        };
      }
}