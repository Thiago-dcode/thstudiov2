import { SharpCompressService } from "./sharp-compress.service";
import { CompressConfig } from "./types";

export class FactoryCompressService {
    public static create(config: CompressConfig) {
        switch(config.driver){
                case 'sharp':
                    return new SharpCompressService(config);
                    default:
                        throw new Error('Compress service not implemented');
        }
    }
}