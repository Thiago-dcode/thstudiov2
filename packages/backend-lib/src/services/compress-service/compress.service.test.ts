import { mbToBytes } from '@repo/common-lib/utils/bytes';
import sharp from 'sharp';
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

const makeGif = (width = 32, height = 32) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .gif()
    .toBuffer();

/**
 * An animation is a vertical strip of `frames` pages; `raw.pageHeight` is what tells Sharp where
 * one frame ends. Each frame gets a different colour so the encoder cannot collapse them.
 */
const makeAnimatedGif = async (width = 64, height = 40, frames = 6) => {
  const pages: Buffer[] = [];
  for (let i = 0; i < frames; i++) {
    pages.push(
      await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: i * 40, g: 20, b: 200 - i * 30 },
        },
      })
        .raw()
        .toBuffer(),
    );
  }
  return sharp(Buffer.concat(pages), {
    raw: { width, height: height * frames, channels: 3, pageHeight: height },
  })
    .gif({ loop: 0, delay: 80 })
    .toBuffer();
};

const framesOf = async (buffer: Buffer) =>
  (await sharp(buffer, { animated: true }).metadata()).pages ?? 1;

describe('SharpCompressService.optimizeGif', () => {
  it('re-encodes a GIF and returns a .gif filename', async () => {
    const source = await makeGif();
    const result = await compressService.optimizeGif(source, 50 * 1024, 90);

    expect(result.filename).toBe('image.gif');
    expect(result.size).toBe(result.buffer.length);
    expect(result.buffer.subarray(0, 3).toString()).toBe('GIF');
  });

  it('preserves every frame of an animation', async () => {
    const source = await makeAnimatedGif(64, 40, 6);
    expect(await framesOf(source)).toBe(6);

    const result = await compressService.optimizeGif(source, 50 * 1024, 90, 32);

    expect(await framesOf(result.buffer)).toBe(6);
  });

  it('bounds the longest edge of each frame, not of the page strip', async () => {
    // 6 stacked 40px frames make a 240px strip: measuring the cap against that would shrink
    // every frame by a further 1/6.
    const source = await makeAnimatedGif(64, 40, 6);
    const result = await compressService.optimizeGif(source, 50 * 1024, 90, 32);

    const metadata = await sharp(result.buffer, { animated: true }).metadata();
    expect(metadata.width).toBe(32);
    expect(metadata.pageHeight).toBe(20);
  });

  it('leaves an already-small GIF untouched instead of re-encoding it larger', async () => {
    const source = await makeAnimatedGif(64, 40, 6);
    const result = await compressService.optimizeGif(source, 5 * 1024 * 1024, 100);

    expect(result.buffer).toBe(source);
    expect(result.size).toBe(source.length);
  });

  it('never returns more bytes than it was given', async () => {
    const source = await makeAnimatedGif(120, 90, 8);
    const result = await compressService.optimizeGif(source, 1024, 100);

    expect(result.size).toBeLessThanOrEqual(source.length);
  });

  it('returns the original bytes for a non-image multer file', async () => {
    const original = Buffer.from('not-an-image');
    const file = {
      buffer: original,
      originalname: 'notes.txt',
      mimetype: 'text/plain',
    } as Express.Multer.File;

    const result = await compressService.optimizeGif(file, 50 * 1024, 90);

    expect(result).toEqual({
      filename: 'notes.txt',
      size: original.length,
      buffer: original,
    });
  });
});

describe('SharpCompressService.optimizeImageToWebp', () => {
  it('flattens an animated GIF to a static WebP poster frame', async () => {
    const source = await makeAnimatedGif(64, 40, 6);
    const result = await compressService.optimizeImageToWebp(source, 50 * 1024, 80);

    const metadata = await sharp(result.buffer, { animated: true }).metadata();
    expect(result.filename).toBe('image.webp');
    expect(metadata.format).toBe('webp');
    expect(metadata.pages ?? 1).toBe(1);
    expect(metadata.height).toBe(40);
  });

  it('bounds the longest edge to maxEdgePx', async () => {
    const source = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .png()
      .toBuffer();

    const result = await compressService.optimizeImageToWebp(source, 500 * 1024, 80, 800);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(400);
  });

  it('defaults to the full-media edge cap when none is given', async () => {
    const source = await sharp({
      create: { width: 1200, height: 600, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .png()
      .toBuffer();

    const result = await compressService.optimizeImageToWebp(source, 500 * 1024, 80);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(1200);
  });
});
