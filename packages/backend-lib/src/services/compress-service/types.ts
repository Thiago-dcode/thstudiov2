import { EnumType } from '@repo/common-lib/constants/enums';

export type CompressServiceDriverType = 'sharp';

export type CompressConfig = {
    driver: CompressServiceDriverType;
}

export type GetSizeCompressedInput = {
    size: number;
    compressLevel: EnumType<'COMPRESSION_LEVEL'>;
    minSize?: number;
    maxSize?: number;
};

