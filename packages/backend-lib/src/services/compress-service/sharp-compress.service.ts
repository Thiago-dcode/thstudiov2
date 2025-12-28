import { CompressService } from "./compress.service";
import { imageSize } from 'image-size';
import sharp from 'sharp';
export class SharpCompressService extends CompressService {

    public async optimizeImageToWebp(
        file: Express.Multer.File,
        quality: number = 90,
        targetSize: number = 2 * 1024 * 1024,
      ): Promise<Buffer> {
        //avoid min of 100KB
        const _targetSize = targetSize < 100 * 1024 ? 100 * 1024 : targetSize;
        if (!file.mimetype.startsWith('image/') || file.size < _targetSize)
          return file.buffer;
    
        const optimizeRecursively = async (
          buffer: Buffer,
          quality: number,
          targetSize: number,
          loops = 0,
        ) => {
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
    
          if (optimizedBuffer.length < targetSize || loops > 3)
            return optimizedBuffer;
          
          return await optimizeRecursively(
            optimizedBuffer,
            _quality - 5,
            targetSize,
            loops + 1,
          );
        };
        return await optimizeRecursively(file.buffer, quality, _targetSize);
      }
}