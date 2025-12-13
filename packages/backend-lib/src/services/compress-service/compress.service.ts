import { CompressConfig } from "./types";

export abstract class CompressService {
    public readonly config:CompressConfig;
    constructor(config:CompressConfig){
        this.config = config;
    }
    abstract  optimizeImageToWebp(
        file: Express.Multer.File,
        quality: number ,
        targetSize: number,
      ): Promise<Buffer> 
}