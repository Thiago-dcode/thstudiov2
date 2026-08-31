import { EnumType } from "@repo/common-lib/constants/enums";
import { resolveAspectRatio } from "@repo/common-lib/utils/aspect-ratio";
import { CompressConfig, GetSizeCompressedInput } from "./types";
import { imageSize } from 'image-size'
export abstract class CompressService {
  public readonly config: CompressConfig;
  constructor(config: CompressConfig) {
    this.config = config;
  }
  /**
   * Calculates the target file size after compression based on the compression level.
   * When `minSize` is set and the original is at or below it, returns the original size unchanged.
   * When `maxSize` is set, caps the compressed target at that value.
   */
  public getSizeCompressed(data: GetSizeCompressedInput): number {
    const { size, compressLevel, minSize, maxSize } = data;
    if (typeof minSize !== 'undefined' && size <= minSize) return size;

    let compressed: number;
    switch (compressLevel) {
      case 'VERY_LOW':
        compressed = size * 0.95;
        break;
      case 'LOW':
        compressed = size * 0.85;
        break;
      case 'NORMAL':
        compressed = size * 0.7;
        break;
      case 'HIGH':
        compressed = size * 0.55;
        break;
      case 'VERY_HIGH':
        compressed = size * 0.4;
        break;
    }

    if (typeof maxSize !== 'undefined') {
      compressed = Math.min(compressed, maxSize);
    }
    return Math.round(compressed);
  }
  public async getImageSize(buffer: Buffer): Promise<{
    width: number,
    height: number
  }> {

    const dimensions = imageSize(buffer);
    if (!dimensions.width || !dimensions.height) {
      throw new Error('Could not determine image dimensions');
    }
    return {
      width: dimensions.width,
      height: dimensions.height
    }
  }

  public async getImageShape(buffer: Buffer): Promise<EnumType<'MEDIA_SHAPE'>> {

    const { width, height } = await this.getImageSize(buffer);

    if (width > height) return 'LANDSCAPE'
    else if (width < height) return 'PORTRAIT'

    return 'SQUARE'

  }

  public async getImageAspectRatio(buffer: Buffer): Promise<EnumType<'ASPECT_RATIO'>> {
    const { width, height } = await this.getImageSize(buffer);
    return resolveAspectRatio(width, height);
  }
  /**
   * Optimizes an image to WebP with specified quality and size constraints.
   * Accepts a Multer upload (API) or a raw Buffer (worker / S3 download).
   */
  abstract optimizeImageToWebp(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality: number,
  ): Promise<{
    filename: string,
    size: number,
    buffer: Buffer
  }>
}