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
 * Thumbnails are listing-sized, not display-sized. They used to be produced at the same
 * `MAX_IMAGE_EDGE_PX` as the full media and merely squeezed toward a byte target, so a
 * "thumbnail" could be a 4000px asset. Nothing in the app renders a thumbnail wider than a
 * grid column.
 */
export const THUMBNAIL_MAX_EDGE_PX = 800;
export const THUMBNAIL_TARGET_BYTES = 120 * 1024;

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
 * The media's compression level expressed as a 0-100 quality, for the encoders that take one.
 *
 * These are the same coefficients {@link CompressService.getSizeCompressed} already applies to
 * bytes, so there is one table rather than two drifting apart. Note the inversion this
 * preserves: VERY_HIGH *compression* is the lowest quality and the smallest file.
 */
export const compressionLevelToQuality = (
  level: EnumType<'COMPRESSION_LEVEL'>,
): number =>
({
  VERY_LOW: 95,
  LOW: 85,
  NORMAL: 70,
  HIGH: 55,
  VERY_HIGH: 40,
}[level]);

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

  /** Re-encodes as GIF, preserving every frame. @param maxEdgePx longest edge kept. */
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
   * Pass {@link THUMBNAIL_MAX_EDGE_PX} as `maxEdgePx` — frame 0 becomes the thumbnail.
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