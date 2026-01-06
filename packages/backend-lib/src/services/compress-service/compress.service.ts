import { EnumType } from "@repo/common-lib/constants/enums";
import { CompressConfig } from "./types";
import { imageSize } from 'image-size'
export abstract class CompressService {
    public readonly config:CompressConfig;
    constructor(config:CompressConfig){
        this.config = config;
    }
   /**
    * Calculates the expected file size after compression based on the compression level.
    * @param size - Original file size in bytes
    * @param compressLevel - Compression level (VERY_LOW: 10%, LOW: 20%, NORMAL: 40%, HIGH: 60%, VERY_HIGH: 80%)
    * @returns Expected file size in bytes after compression
    */
   public getSizeCompressed(size:number,compressLevel:EnumType<'COMPRESSION_LEVEL'>, minSize?:number): number {
    if(typeof minSize !=='undefined'  && size <= minSize) return size;
    switch (compressLevel) {
      case 'VERY_LOW':
        return size * 0.95;  // 5%
      case 'LOW':
        return size * 0.85;  // 15%
      case 'NORMAL':
        return size * 0.7;   // 30%
      case 'HIGH':
        return size * 0.55;  // 45%
      case 'VERY_HIGH':
        return size * 0.4;   // 60%
    }
   }
   public async getImageSize(buffer:Buffer):Promise<{
    width:number,
    height:number
   }>{

    const dimensions =  imageSize(buffer);
    if (!dimensions.width || !dimensions.height) {
      throw new Error('Could not determine image dimensions');
    }
    return {
      width: dimensions.width,
      height:dimensions.height
    }
   }

   public async getImageShape(buffer:Buffer):Promise<EnumType<'MEDIA_SHAPE'>>{

    const {width,height} = await this.getImageSize(buffer);

    if(width>height) return 'LANDSCAPE'
    else if(width<height) return 'PORTRAIT'
    
    return 'SQUARE'

   }
    /**
     * Optimizes an image file to WebP format with specified quality and size constraints.
     * @param file - The uploaded image file to optimize
     * @param targetSize - Target file size in bytes
     * @param quality - Quality level for the WebP output (0-100)
     * @returns The optimized image with filename, size (in bytes), and buffer
     */
    abstract  optimizeImageToWebp(
        file: Express.Multer.File,
        targetSize: number,
        quality: number,
      ): Promise<{
        filename:string,
        size:number,
        buffer:Buffer
      }> 
}