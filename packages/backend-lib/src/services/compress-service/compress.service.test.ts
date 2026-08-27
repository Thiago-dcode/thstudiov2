import { mbToBytes } from '@repo/common-lib/utils/bytes';
import { FactoryCompressService } from './factory-compress.service';

const compressService = FactoryCompressService.create({ driver: 'sharp' });

const MB = 1024 * 1024;

describe('CompressService.getSizeCompressed', () => {
  it('returns original size when at or below minSize', () => {
    const size = 200 * 1024;
    expect(
      compressService.getSizeCompressed({
        size,
        compressLevel: 'NORMAL',
        minSize: 300 * 1024,
      }),
    ).toBe(size);
  });

  it('applies compression level and rounds the result', () => {
    expect(
      compressService.getSizeCompressed({
        size: 10 * MB,
        compressLevel: 'NORMAL',
      }),
    ).toBe(Math.round(10 * MB * 0.7));
  });

  it('caps the result at maxSize', () => {
    expect(
      compressService.getSizeCompressed({
        size: 10 * MB,
        compressLevel: 'NORMAL',
        maxSize: mbToBytes(5),
      }),
    ).toBe(mbToBytes(5));
  });

  it('skips compression and max cap when size is at or below minSize', () => {
    const size = 250 * 1024;
    expect(
      compressService.getSizeCompressed({
        size,
        compressLevel: 'VERY_HIGH',
        minSize: 300 * 1024,
        maxSize: 100 * 1024,
      }),
    ).toBe(size);
  });

  it.each([
    ['VERY_LOW', 0.95],
    ['LOW', 0.85],
    ['NORMAL', 0.7],
    ['HIGH', 0.55],
    ['VERY_HIGH', 0.4],
  ] as const)('applies %s compression factor', (compressLevel, factor) => {
    const size = 2 * MB;
    expect(
      compressService.getSizeCompressed({
        size,
        compressLevel,
      }),
    ).toBe(Math.round(size * factor));
  });
});
