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

/**
 * Animated GIFs get a much tighter cap: every pixel is paid for once per frame, so a 4000px
 * animation is tens of times heavier than a 4000px still for no visible benefit. Nothing in the
 * app displays a GIF wider than a content column.
 */
const MAX_GIF_EDGE_PX = 1200;

/** Quality is clamped rather than rejected so callers can pass raw arithmetic results. */
const clampQuality = (quality: number): number =>
    quality > 100 ? 100 : quality < 10 ? 10 : quality;

/**
 * GIF has no single quality knob, and re-encoding one is not a free win: a source GIF already
 * carries inter-frame optimisation, so a naive full-palette re-encode reliably comes out *larger*
 * than the input. Measured on a 480px/96-frame 7.6MB GIF:
 *
 *   colours 256, dither 1.0, interFrameMaxError 0  →  12.0 MB   (the previous settings)
 *   colours 128, dither 0.5, interFrameMaxError 8  →   5.3 MB
 *   colours  66, dither 0.2, interFrameMaxError 21 →   2.7 MB
 *
 * So the three knobs move together off one `quality`, and the top of the range is deliberately
 * capped well below 256 colours / full dithering. Error diffusion is the most expensive of the
 * three: it injects high-frequency noise that GIF's LZW cannot compress at all.
 */
const qualityToColours = (quality: number): number =>
    Math.max(8, Math.round(16 + ((clampQuality(quality) - 10) / 90) * 112));

const qualityToDither = (quality: number): number =>
    Math.round(((clampQuality(quality) - 10) / 90) * 0.5 * 100) / 100;

/** Higher tolerance lets more of each frame be encoded as "unchanged since the last one". */
const qualityToInterFrameMaxError = (quality: number): number =>
    Math.round(8 + ((100 - clampQuality(quality)) / 90) * 24);

/** GIF87a/GIF89a magic. Lets us leave an already-good source alone rather than re-encoding it. */
const isGifBuffer = (buffer: Buffer): boolean =>
    buffer.subarray(0, 3).toString('latin1') === 'GIF';

export class SharpCompressService extends CompressService {

    /**
     * Optimizes an image to WebP with specified quality and size constraints.
     * @param file - Multer upload or raw image bytes
     * @param targetSize - Target file size in bytes. Minimum enforced is 50KB.
     * @param quality - Quality level for the WebP output (0-100), defaults to 90
     * @param maxEdgePx - Longest edge kept, defaults to {@link MAX_IMAGE_EDGE_PX}
     */
    public async optimizeImageToWebp(
        file: Express.Multer.File | Buffer,
        targetSize: number,
        quality: number = 90,
        maxEdgePx: number = MAX_IMAGE_EDGE_PX,
      ): Promise<{ filename: string; size: number; buffer: Buffer }> {
        const isBuffer = Buffer.isBuffer(file);
        const source = isBuffer ? file : file.buffer;
        if (!source) {
          throw new Error('File buffer is required for image processing. Ensure multer is using memory storage.');
        }

        const originalName = isBuffer ? 'image' : path.parse(file.originalname).name;
        const webpFilename = `${originalName}.webp`;

        // Non-images are never processed here — multer's fileFilter should have rejected them.
        // A raw Buffer has no mimetype; the worker already moderated it as an image.
        if (!isBuffer && !file.mimetype.startsWith('image/')) {
          return {
            filename: file.originalname,
            size: source.length,
            buffer: source,
          };
        }

        //avoid min of 100KB
        const _targetSize = targetSize < 100 * 1024 ? 50 * 1024 : targetSize;

        // A single decode of the original, bounded and ALWAYS re-encoded to WebP — including when
        // the source is already under the target. Callers store this under a `.webp` key whose
        // ContentType is derived from the extension, so handing back the source bytes would serve
        // e.g. PNG data labelled `image/webp`, which downstream consumers (the moderation vision
        // model reads the stored thumbnail by URL) reject outright.
        //
        // No `{ animated: true }`: an animated source is deliberately flattened to its first
        // frame. This is what makes a GIF's thumbnail a static poster.
        let buffer = await sharp(source)
          .resize({
            width: maxEdgePx,
            height: maxEdgePx,
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

    /**
     * Optimizes an (animated) GIF with specified quality and size constraints.
     * Quality is mapped onto GIF palette size and dithering; animation frames are preserved.
     * @param file - Multer upload or raw image bytes
     * @param targetSize - Target file size in bytes. Minimum enforced is 50KB.
     * @param quality - Quality level mapped to palette size (0-100), defaults to 90
     * @param maxEdgePx - Longest edge kept, defaults to {@link MAX_GIF_EDGE_PX}
     */
    public async optimizeGif(
        file: Express.Multer.File | Buffer,
        targetSize: number,
        quality: number = 90,
        maxEdgePx: number = MAX_GIF_EDGE_PX,
      ): Promise<{ filename: string; size: number; buffer: Buffer }> {
        const isBuffer = Buffer.isBuffer(file);
        const source = isBuffer ? file : file.buffer;
        if (!source) {
          throw new Error('File buffer is required for image processing. Ensure multer is using memory storage.');
        }

        const originalName = isBuffer ? 'image' : path.parse(file.originalname).name;
        const gifFilename = `${originalName}.gif`;

        // Non-images are never processed here — multer's fileFilter should have rejected them.
        // A raw Buffer has no mimetype; the worker already moderated it as an image.
        if (!isBuffer && !file.mimetype.startsWith('image/')) {
          return {
            filename: file.originalname,
            size: source.length,
            buffer: source,
          };
        }

        //avoid min of 100KB
        const _targetSize = targetSize < 100 * 1024 ? 50 * 1024 : targetSize;

        // Sharp represents an animation as a vertical strip of pages; `pageHeight` is one frame.
        const metadata = await sharp(source, { animated: true }).metadata();
        const frameWidth = metadata.width ?? 0;
        const frameHeight = metadata.pageHeight ?? metadata.height ?? 0;
        const oversized = frameWidth > maxEdgePx || frameHeight > maxEdgePx;
        const sourceIsGif = isGifBuffer(source);

        // Unlike the WebP path there is no format mismatch to correct here — a GIF source under
        // a `.gif` key is already exactly what the ContentType claims. Re-encoding it would only
        // burn several seconds of worker CPU to make the file bigger.
        if (sourceIsGif && !oversized && source.length <= _targetSize) {
          return { filename: gifFilename, size: source.length, buffer: source };
        }

        // `animated: true` keeps every frame — without it Sharp flattens to the first frame only.
        // `fit: 'inside'` is measured against a single page, so the cap means what it says.
        let currentQuality = clampQuality(quality);
        let width = oversized ? maxEdgePx : frameWidth || maxEdgePx;
        let height = oversized ? maxEdgePx : frameHeight || maxEdgePx;
        let buffer = await this.encodeGif(source, currentQuality, { width, height });

        // Resizing is by far the strongest lever (and each pass gets cheaper as the raster
        // shrinks), so the fallback drops 30% of each edge and 25 quality points per pass. The
        // previous 10%/-5 budget over 5 passes could not close the gap on a real animation, and
        // whatever came out was still billed against the user's storage quota.
        const reduce = 0.7;
        for (let loops = 0; buffer.length > _targetSize && loops < 4; loops++) {
          const nextQuality = clampQuality(currentQuality - 25);
          const nextWidth = Math.max(1, Math.floor(width * reduce));
          const nextHeight = Math.max(1, Math.floor(height * reduce));
          // Nothing left to give — stop rather than burn passes re-encoding identical bytes.
          if (
            nextQuality === currentQuality &&
            nextWidth === width &&
            nextHeight === height
          ) {
            break;
          }
          currentQuality = nextQuality;
          width = nextWidth;
          height = nextHeight;
          // Re-encode from the ORIGINAL each pass rather than from the previous output: chaining
          // GIF encodes compounds palette loss and dithering noise, looking worse for less gain.
          buffer = await this.encodeGif(source, currentQuality, { width, height });
        }

        // Never hand back something bigger than what we were given.
        if (sourceIsGif && !oversized && buffer.length >= source.length) {
          return { filename: gifFilename, size: source.length, buffer: source };
        }

        return {
          filename: gifFilename,
          size: buffer.length,
          buffer,
        };
      }

    /** One animated GIF encode at the given per-frame bounding box. */
    private async encodeGif(
      source: Buffer,
      quality: number,
      size: { width: number; height: number },
    ): Promise<Buffer> {
      return sharp(source, { animated: true })
        .resize({
          width: size.width,
          height: size.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .gif({
          colours: qualityToColours(quality),
          dither: qualityToDither(quality),
          interFrameMaxError: qualityToInterFrameMaxError(quality),
        })
        .toBuffer();
    }
}
