import { EnumType } from "@repo/common-lib/constants/enums";
import { resolveAspectRatio } from "@repo/common-lib/utils/aspect-ratio";
import {
  CompressConfig,
  CompressionOutput,
  ExtractVideoFramesInput,
  GetSizeCompressedInput,
  VideoCompressionOutput,
} from "./types";
import { imageSize } from 'image-size'

/**
 * Thumbnails are listing-sized, not display-sized: they used to be produced at the same
 * `MAX_IMAGE_EDGE_PX` as the full media and merely squeezed toward a byte target, so a
 * "thumbnail" could be a 4000px asset.
 *
 * 1200 rather than the 800 that replaced it, because "a grid tile" undersold what this object is.
 * The same bytes are ALSO the `og:image`, the sitemap image and the still the SEO metadata model
 * reads — and the social platforms want an OG image at least 1200px wide, serving a small
 * summary card instead of the large one below that. A 400px grid column on a 3x display asks for
 * the same 1200 independently.
 *
 * The byte target has to rise alongside the edge or nothing is gained: the refine loop chases
 * `targetSize`, so leaving it at 120KB would just resize the extra pixels straight back off.
 *
 * There is no matching quality constant. A thumbnail is encoded at the media's OWN compression
 * level, via {@link compressionLevelToQuality} — someone who asked for VERY_HIGH compression
 * asked for it about their media, and a tile that stays pristine while the media it represents
 * is squeezed shows them something their media no longer looks like.
 */
export const THUMBNAIL_MAX_EDGE_PX = 1200;
export const THUMBNAIL_TARGET_BYTES = 400 * 1024;

/**
 * The budget for a video's SAMPLED frames — `previews[1..N]`, everything except the poster.
 *
 * These are model input and nothing else. A vision model cannot read an MP4, so the frames are
 * what the moderation verdict is drawn from and what the SEO metadata describes; no page renders
 * one and no person ever opens one. Both jobs are coarse — "is there nudity in this", "what is
 * happening here" — and neither improves with pixels the way a grid tile does.
 *
 * They are also the most expensive thing a video stores. `VIDEO_PREVIEW_FRAMES` of them are kept
 * per upload and each is billed separately against the user's quota, so the frames outnumber
 * every other object the media owns put together. At a thumbnail's budget ten of them cost more
 * than most thumbnails plus the preview clip; at this one they are a rounding error.
 *
 * Frame 0 is NOT one of these — it is the thumbnail, and gets {@link THUMBNAIL_TARGET_BYTES}.
 */
export const VIDEO_SAMPLE_FRAME_MAX_EDGE_PX = 640;
export const VIDEO_SAMPLE_FRAME_TARGET_BYTES = 60 * 1024;
export const VIDEO_SAMPLE_FRAME_QUALITY = 45;

/**
 * The preview clip is a hover-sized teaser, not a viewing copy: it plays inline at grid scale
 * while the media's own full-resolution encode stays available for anyone who opens it. 720
 * halves the pixel cost of the extra encode against a 1080p source and still covers a
 * full-width card on a retina display.
 */
export const PREVIEW_MAX_EDGE_PX = 720;

/**
 * Advisory, like every video byte target: the real budget is bitrate × duration, and the
 * preview's duration is bounded by `PREVIEW_MAX_DURATION_SECONDS`. 720p at ~2.5 Mbps for ten
 * seconds lands near 3MB, so this is the figure the encode is aimed at rather than a cap it is
 * squeezed under.
 */
export const PREVIEW_TARGET_BYTES = 3 * 1024 * 1024;

/**
 * What each compression level asks for, as a fraction of the input.
 *
 * The one table. {@link CompressService.getSizeCompressed} reads it for bytes and
 * {@link compressionLevelToQuality} reads it for encoder quality, so the two cannot drift — they
 * used to be separate literals that merely happened to agree. Note the inversion it preserves:
 * VERY_HIGH *compression* is the lowest coefficient, the lowest quality and the smallest file.
 */
export const COMPRESSION_LEVEL_RATIO: Record<
  EnumType<'COMPRESSION_LEVEL'>,
  number
> = {
  VERY_LOW: 0.95,
  LOW: 0.85,
  NORMAL: 0.7,
  HIGH: 0.55,
  VERY_HIGH: 0.4,
};

/**
 * The media's compression level expressed as a 0-100 quality, for the encoders that take one.
 *
 * Every encoder here takes it: video hands it to libx264 as CRF, WebP as its quality parameter,
 * and GIF spends it on inter-frame tolerance and the size of the box each frame is fitted to.
 */
export const compressionLevelToQuality = (
  level: EnumType<'COMPRESSION_LEVEL'>,
): number =>
  // Rounded because binary floating point does not agree that 0.7 * 100 is 70, and an encoder
  // handed 70.00000000000001 as a quality is at best relying on its own coercion.
  Math.round(COMPRESSION_LEVEL_RATIO[level] * 100);

/**
 * Thrown when the INPUT is what makes the work impossible: too many pixels, too long, no video
 * stream in it at all. What separates it from every other failure here is that the outcome is
 * FIXED — the same bytes through the same encoder fail identically every time — so a caller that
 * retries only pays for the same failure again. See {@link isPermanentMediaError}.
 *
 * The media processor surfaces `message` to the user verbatim as `failed_reason`, so write it for
 * them: name the limit and the number that broke it, never a temp path or a library's internals.
 */
export class MediaInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaInputError';
  }
}

/**
 * Sharp's rejections of exactly the same kind. These surface from native code as plain `Error`s,
 * so there is no throw site to wrap — matching the message is the only handle there is. All five
 * are fixed string literals in `common.cc` rather than anything locale- or input-dependent.
 */
const PERMANENT_INPUT_MESSAGES = [
  'Input image exceeds pixel limit',
  'Input buffer contains unsupported image format',
  'Input file contains unsupported image format',
  'Input buffer has corrupt header',
  'Input file has corrupt header',
];

/**
 * Whether retrying this error could ever produce a different result.
 *
 * The distinction that matters to a queue: a timed-out encode or a dropped S3 connection is worth
 * another attempt, and a 400-megapixel GIF is not. Retrying the second kind is not merely
 * pointless — each attempt re-downloads the source and pays for another moderation vision call
 * before arriving at the identical error.
 */
export const isPermanentMediaError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  // `name` as well as `instanceof`: a caller resolving a second copy of this package (or reaching
  // it through the CJS build while it was thrown from the ESM one) gets a class identity that no
  // longer matches, and silently falls back to retrying what it should not.
  if (error instanceof MediaInputError || error.name === 'MediaInputError') return true;
  return PERMANENT_INPUT_MESSAGES.some((message) => error.message.includes(message));
};

export abstract class CompressService {
  public readonly config: CompressConfig;
  constructor(config: CompressConfig) {
    this.config = config;
  }
  /**
   * Calculates the target file size after compression based on the compression level.
   * When `minSize` is set and the original is at or below it, returns the original size unchanged.
   *
   * `maxSize` bounds the size the ratio is measured AGAINST, not the ratio's result. Applied the
   * other way round — `min(size * ratio, maxSize)` — it flattens the level ladder completely:
   * every source above `maxSize / 0.95` saturates the cap at all five levels and gets one
   * identical target, which is how an 18MB GIF came out byte-for-byte identical at VERY_LOW and
   * at HIGH. This way the ladder survives at every source size and the cap still holds, since the
   * largest target it can produce is `0.95 * maxSize`.
   */
  public getSizeCompressed(data: GetSizeCompressedInput): number {
    const { size, compressLevel, minSize, maxSize } = data;
    if (typeof minSize !== 'undefined' && size <= minSize) return size;

    const bounded =
      typeof maxSize !== 'undefined' ? Math.min(size, maxSize) : size;

    return Math.round(bounded * COMPRESSION_LEVEL_RATIO[compressLevel]);
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
   *
   * Decodes a single frame, so passing an animated GIF here yields the static poster frame —
   * which is exactly how media thumbnails are produced.
   *
   * @param maxEdgePx longest edge kept, defaulting to the full-media cap. Pass
   * {@link THUMBNAIL_MAX_EDGE_PX} for thumbnails.
   */
  abstract optimizeImageToWebp(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality: number,
    maxEdgePx?: number,
  ): Promise<CompressionOutput>

  /**
   * Re-encodes as GIF, preserving every frame.
   *
   * @param maxEdgePx longest edge kept, measured against ONE frame rather than the page strip.
   * How many frames sit behind it is not capped: an animation is bounded by the upload's byte
   * limit, and nothing here rejects one for the pixels those bytes expand to.
   */
  abstract optimizeGif(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality: number,
    maxEdgePx?: number,
  ): Promise<CompressionOutput>

  /**
   * Extracts one representative frame from a video and runs it through
   * {@link optimizeImageToWebp}, so a video poster travels the exact same path as every other
   * thumbnail: same encoder, same byte target, same `.webp` key, same ContentType.
   *
   * **Call this BEFORE {@link optimizeVideo}.** Moderation is a vision call over a URL and
   * cannot read an MP4, so the poster is what gets moderated — and doing it first means a
   * rejected video costs zero minutes of transcode instead of being encoded and thrown away.
   *
   * @param maxEdgePx longest edge kept, defaulting to the full-media cap. Pass
   * {@link THUMBNAIL_MAX_EDGE_PX} for thumbnails.
   */
  abstract optimizeVideoFrameToWebp(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality?: number,
    maxEdgePx?: number,
  ): Promise<CompressionOutput>

  /**
   * Samples frames across a video from a single probe, each one a WebP produced exactly like
   * {@link optimizeVideoFrameToWebp}'s.
   *
   * This exists for moderation. A vision model cannot read an MP4, so what it judges is the
   * frames we hand it, and one frame from the first second can only ever vouch for the first
   * second. Sampling across the clip is what makes "this video is fine" mean the video rather
   * than its opening. Frame 0 doubles as the poster, so this costs no extra object beyond the
   * additional stills.
   *
   * **Call this BEFORE {@link optimizeVideo}**, for the same reason: a rejected video should
   * cost zero minutes of transcode.
   *
   * Frame 0 is encoded with `poster` and every other frame with `sample`, because they are not
   * the same asset: frame 0 is the thumbnail a person sees, the rest are model input. See
   * {@link VIDEO_SAMPLE_FRAME_TARGET_BYTES}.
   *
   * @returns one frame per percentage, in the order requested, never empty.
   */
  abstract extractVideoFrames(
    input: ExtractVideoFramesInput,
  ): Promise<CompressionOutput[]>

  /**
   * Re-encodes to a web-deliverable MP4 (H.264 + AAC, faststart), or hands the source back
   * untouched when it already is one.
   *
   * @param targetSize ADVISORY. Video's real budget is bitrate × duration, so a byte target is
   * raised internally to what the source's resolution tier is worth — a fixed cap cannot be met
   * by a long clip at any quality worth shipping. Pass no `maxSize` to `getSizeCompressed` when
   * computing it.
   * @param quality 10-100, mapped onto H.264 CRF. Derive it from the media's compression level
   * with {@link compressionLevelToQuality} rather than passing a flat number.
   * @param maxEdgePx longest edge kept.
   */
  abstract optimizeVideo(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality?: number,
    maxEdgePx?: number,
  ): Promise<VideoCompressionOutput>

  /**
   * Encodes the opening seconds of a video as a small, silent, inline-playable MP4.
   *
   * Only worth calling when the source runs longer than `maxDurationSeconds`: a video already
   * shorter than the preview window IS its own preview, and callers should point at the media's
   * own key instead of paying for a near-duplicate object. `optimizeVideo`'s result carries the
   * `durationSeconds` needed to make that call for free.
   *
   * Unlike {@link optimizeVideo} this never short-circuits on an already-web-ready source — the
   * point is a trimmed, downscaled, audio-stripped derivative, which no source can already be —
   * and it never refines: the output is bounded by construction, so a second pass could only
   * cost time.
   *
   * @param targetSize ADVISORY, as in {@link optimizeVideo}. Pass {@link PREVIEW_TARGET_BYTES}.
   * @param quality 10-100, mapped onto H.264 CRF.
   * @param maxEdgePx longest edge kept. Pass {@link PREVIEW_MAX_EDGE_PX}.
   * @param maxDurationSeconds clip length, defaulting to `PREVIEW_MAX_DURATION_SECONDS`.
   */
  abstract optimizeVideoPreview(
    file: Express.Multer.File | Buffer,
    targetSize: number,
    quality?: number,
    maxEdgePx?: number,
    maxDurationSeconds?: number,
  ): Promise<VideoCompressionOutput>

}