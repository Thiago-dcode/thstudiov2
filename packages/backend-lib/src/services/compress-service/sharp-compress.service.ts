import { CompressService, THUMBNAIL_MAX_EDGE_PX } from "./compress.service";
import { imageSize } from 'image-size';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import {
    encodeTimeoutMs,
    extractPosterFrame,
    fitInside,
    hasFastStart,
    isMp4Brand,
    probeVideo,
    remuxToMp4,
    transcodeToMp4,
    withTempDir,
    writeTempFile,
    type TranscodeAudioPlan,
} from './ffmpeg';
import { CompressionOutput, VideoCompressionOutput, VideoProbe } from './types';
import { MAX_VIDEO_DURATION_SECONDS } from '@repo/common-lib/constants/limits';

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

/**
 * Longest edge kept for video. Video is priced per pixel per FRAME: 4K30 is four times the
 * pixels of 1080p for roughly four times the bits, and nothing in the app renders a video wider
 * than a content column. 1920 keeps a 16:9 clip at 1920x1080 and a 9:16 phone clip at
 * 1080x1920 — both native, neither upscaled.
 */
const MAX_VIDEO_EDGE_PX = 1920;

/**
 * 60fps doubles the frame count for ~35-40% more bits at the same CRF and buys nothing on the
 * process footage this app is full of. Only ever applied when the source is ABOVE it — never
 * upsample. The 0.5 tolerance covers 30000/1001 (29.97) and 60000/1001 (59.94).
 */
const MAX_VIDEO_FPS = 30;

/**
 * libx264 preset. `medium` is ~15-18% smaller at the same CRF but ~3.5x slower, and wall-clock
 * is the binding constraint here rather than CPU cost: the media worker runs at BullMQ's
 * default concurrency of one, so a six-minute encode stalls every thumbnail queued behind it.
 * We buy the bitrate back with a slightly tighter CRF instead, which is the cheaper trade.
 */
const VIDEO_PRESET = 'veryfast';

/** Only the refine pass may go past the mapped band's floor of 30. */
const VIDEO_CRF_MAX = 32;

/** Don't spend a whole second encode to shave off less than this. */
const VIDEO_TARGET_TOLERANCE = 1.15;

/** Extracted at 2x the thumbnail box so Sharp's Lanczos downscale has an oversample. */
const POSTER_EXTRACT_EDGE_PX = THUMBNAIL_MAX_EDGE_PX * 2;

/**
 * Delivery-reference bitrates, tiered by PIXEL COUNT rather than height so orientation and odd
 * aspect ratios behave: 1920x1080, 1080x1920 and 1440x1440 each cost what their pixels cost,
 * where a height-keyed ladder would file a 21:9 2560x1080 and a 16:9 1920x1080 in the same
 * bucket despite a 33% pixel difference.
 *
 * `targetBps` is what mature streaming services actually deliver for H.264 SDR — 1080p at
 * 4.5 Mbps sits between YouTube's avc1 VOD (~4.4-4.8) and under Apple's HLS Authoring Spec
 * (6.0 average for 1080p High). `skipBps` is 1.35x that, the "already compressed, leave it
 * alone" ceiling; `maxrateBps` is ~1.45x, the VBV cap for capped-CRF.
 */
const VIDEO_BITRATE_LADDER = [
    { name: '360p', maxPixels: 640 * 360, targetBps: 800_000, skipBps: 1_100_000, maxrateBps: 1_200_000 },
    { name: '480p', maxPixels: 854 * 480, targetBps: 1_200_000, skipBps: 1_600_000, maxrateBps: 1_800_000 },
    { name: '720p', maxPixels: 1280 * 720, targetBps: 2_500_000, skipBps: 3_500_000, maxrateBps: 3_600_000 },
    { name: '1080p', maxPixels: 1920 * 1080, targetBps: 4_500_000, skipBps: 6_000_000, maxrateBps: 6_500_000 },
    { name: 'max', maxPixels: Number.POSITIVE_INFINITY, targetBps: 6_000_000, skipBps: 8_000_000, maxrateBps: 8_500_000 },
] as const;

type VideoTier = (typeof VIDEO_BITRATE_LADDER)[number];

const tierFor = (pixels: number): VideoTier =>
    VIDEO_BITRATE_LADDER.find((tier) => pixels <= tier.maxPixels) ??
    VIDEO_BITRATE_LADDER[VIDEO_BITRATE_LADDER.length - 1]!;

/**
 * H.264 has one honest quality knob: CRF. It targets QUALITY, so a static shot spends few bits
 * and a busy pan spends many — which is exactly what "clean" means. Bitrate targeting (`-b:v`)
 * does the opposite: identical bits for both, over-spending on easy content and smearing hard
 * content. Every +6 CRF roughly halves the bitrate.
 *
 * Measured on a 45s 1080p30 iPhone clip (source 17.4 Mbps / 98MB), libx264 `-preset veryfast`:
 *
 *   CRF 20 → 5.1 Mbps / 28.7 MB   indistinguishable from the source at 100% zoom
 *   CRF 23 → 3.4 Mbps / 19.1 MB
 *   CRF 26 → 2.3 Mbps / 12.9 MB   no visible artefacts
 *   CRF 30 → 1.4 Mbps /  7.9 MB   banding begins on flat gradients
 *   CRF 34 → 0.9 Mbps /  5.1 MB   obvious blocking; unusable for a portfolio
 *
 * So the mapped band is 20-30: below 20 we are paying to store sensor noise, and past 30 the
 * flat colour and soft gradients that dominate art footage band visibly — the one artefact a
 * portfolio cannot ship. Only the refine pass is allowed past it, up to {@link VIDEO_CRF_MAX}.
 */
const qualityToCrf = (quality: number): number =>
    Math.round(30 - ((clampQuality(quality) - 10) / 90) * 10);

/** Profiles every browser and mobile SoC decodes in hardware. `High 10` / `High 4:2:2` do not. */
const WEB_SAFE_H264_PROFILES = new Set([
    'Baseline', 'Constrained Baseline', 'Main', 'High',
]);

/** 8-bit 4:2:0 is the only chroma layout with universal hardware decode support. */
const isWebSafePixelFormat = (pixelFormat: string | null): boolean =>
    pixelFormat === 'yuv420p' || pixelFormat === 'yuvj420p';

type TranscodePlan = {
    crf: number;
    tier: VideoTier;
    scale: { width: number; height: number } | null;
    fps: number | null;
    outputWidth: number;
    outputHeight: number;
    audio: TranscodeAudioPlan;
};

/**
 * 128 kbps AAC is transparent enough for the speech and music beds that show up here, and it is
 * under 5% of even the smallest video budget — tightening it buys nothing measurable while
 * risking audible artefacts. Anything above stereo is downmixed: browsers and laptops play two
 * channels anyway, so six channels at 384 kbps is pure waste.
 */
function resolveAudioPlan(probe: VideoProbe): TranscodeAudioPlan {
    if (!probe.audio) return { mode: 'none' };

    const { codec, channels, bitRate, sampleRate } = probe.audio;
    // Already web-safe. Copying avoids a whole generation of audio loss for free, even though
    // the video alongside it is being re-encoded.
    if (codec === 'aac' && channels <= 2 && (bitRate ?? 0) <= 160_000) {
        return { mode: 'copy' };
    }

    const outputChannels = Math.min(2, Math.max(1, channels || 2));
    return {
        mode: 'encode',
        bitrateBps: outputChannels === 1 ? 96_000 : 128_000,
        channels: outputChannels,
        // Left alone at the two rates the AAC encoder handles natively; resampling 44.1k → 48k
        // is a needless generation of loss.
        sampleRate: sampleRate === 44_100 || sampleRate === 48_000 ? null : 48_000,
    };
}

/**
 * Rejects rather than trims. Silently cutting a user's video is data loss they never asked for,
 * and this message reaches them verbatim as the media's `failed_reason`.
 */
function assertDurationWithinLimit(probe: VideoProbe): void {
    if (probe.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        throw new Error(
            `Video is too long: ${Math.round(probe.durationSeconds)}s, maximum is ${MAX_VIDEO_DURATION_SECONDS}s`,
        );
    }
}

const resolveSourceBuffer = (file: Express.Multer.File | Buffer): Buffer => {
    const source = Buffer.isBuffer(file) ? file : file.buffer;
    if (!source) {
        throw new Error('File buffer is required for video processing. Ensure multer is using memory storage.');
    }
    return source;
};

const resolveOriginalName = (
    file: Express.Multer.File | Buffer,
    fallback: string,
): string => (Buffer.isBuffer(file) ? fallback : path.parse(file.originalname).name);

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

    /**
     * Extracts a poster frame and hands it to {@link optimizeImageToWebp}, so a video thumbnail
     * is byte-for-byte the same kind of asset as every other one.
     *
     * @param file - Multer upload or raw video bytes
     * @param targetSize - Target file size in bytes for the resulting WebP
     * @param quality - Quality level for the WebP output (0-100), defaults to 80
     * @param maxEdgePx - Longest edge kept, defaults to {@link THUMBNAIL_MAX_EDGE_PX}
     */
    public async optimizeVideoFrameToWebp(
        file: Express.Multer.File | Buffer,
        targetSize: number,
        quality: number = 80,
        maxEdgePx: number = THUMBNAIL_MAX_EDGE_PX,
    ): Promise<CompressionOutput> {
        const source = resolveSourceBuffer(file);

        return withTempDir(async (dir) => {
            const inputPath = await writeTempFile(dir, 'source', source);
            const posterPath = path.join(dir, 'poster.png');
            const probe = await probeVideo(inputPath);
            assertDurationWithinLimit(probe);

            await extractPosterFrame(inputPath, posterPath, {
                // Not frame zero: a large share of real uploads open on black or a fade-in, and
                // a black poster is not only a bad grid tile — it is also what the moderation
                // vision model sees, so it would poison that decision too.
                seekSeconds: Math.min(1, probe.durationSeconds / 10),
                scale: fitInside(
                    probe.video.width,
                    probe.video.height,
                    POSTER_EXTRACT_EDGE_PX,
                ),
            });

            const poster = await fs.readFile(posterPath);
            const optimized = await this.optimizeImageToWebp(
                poster,
                targetSize,
                quality,
                maxEdgePx,
            );
            return {
                ...optimized,
                filename: `${resolveOriginalName(file, 'video')}.webp`,
            };
        });
    }

    /**
     * Re-encodes a video to a web-deliverable MP4, or leaves an already-compressed one alone.
     *
     * @param file - Multer upload or raw video bytes
     * @param targetSize - Advisory byte target; raised to the resolution tier's bitrate budget
     * @param quality - Quality level mapped to H.264 CRF (10-100), defaults to 55 (`HIGH`)
     * @param maxEdgePx - Longest edge kept, defaults to {@link MAX_VIDEO_EDGE_PX}
     */
    public async optimizeVideo(
        file: Express.Multer.File | Buffer,
        targetSize: number,
        quality: number = 55,
        maxEdgePx: number = MAX_VIDEO_EDGE_PX,
    ): Promise<VideoCompressionOutput> {
        const source = resolveSourceBuffer(file);
        const filename = `${resolveOriginalName(file, 'video')}.mp4`;

        return withTempDir(async (dir) => {
            const inputPath = await writeTempFile(dir, 'source', source);
            const probe = await probeVideo(inputPath);
            assertDurationWithinLimit(probe);

            const { width, height } = probe.video;
            const tier = tierFor(width * height);

            const asOutput = (
                buffer: Buffer,
                overrides: Partial<VideoCompressionOutput> = {},
            ): VideoCompressionOutput => ({
                filename,
                size: buffer.length,
                buffer,
                width,
                height,
                durationSeconds: probe.durationSeconds,
                bitRate: probe.bitRate,
                reencoded: false,
                ...overrides,
            });

            /** Container-only rewrite. Bitstreams are untouched, so this is not a re-encode. */
            const remux = async (): Promise<VideoCompressionOutput> => {
                const remuxedPath = path.join(dir, 'remuxed.mp4');
                await remuxToMp4(inputPath, remuxedPath);
                const remuxed = await fs.readFile(remuxedPath);
                return asOutput(remuxed);
            };

            // ── The most important rule in this file ────────────────────────────────────────
            // Do not re-encode a video the user already compressed. Re-encoding H.264 is
            // nothing like resizing a JPEG: it is a full decode plus re-encode that costs
            // minutes of the only media worker slot there is, throws away detail permanently,
            // and on an already-lean source frequently hands back a LARGER file.
            //
            // The tell is BITRATE, not byte size. Sources and already-compressed exports sit in
            // two cleanly separated populations:
            //
            //   iPhone 1080p30 h264           ~17 Mbps    ~4x the ladder
            //   iPhone 4K60 hevc              ~45 Mbps    ~10x
            //   Android 1080p30              12-20 Mbps
            //   Premiere/Resolve "web" export 6-10 Mbps
            //   Handbrake "Fast 1080p30"       4-5 Mbps   ~1x  ← already done, leave it alone
            //   Re-download from IG / TikTok 1.5-3 Mbps        ← already done, twice
            //
            // `skipBps` sits at 1.35x the delivery target, right inside that gap. Above it a
            // re-encode wins 60-90%; below it, under 25% — never worth minutes of CPU plus a
            // generation of loss.
            //
            // Byte size is deliberately NOT part of this decision, unlike the GIF path. Bytes
            // are bitrate × duration: a perfectly encoded four-minute clip exceeds any fixed
            // byte target, and chasing that number grinds good footage into mush.
            const alreadyWebReady =
                probe.video.codec === 'h264' &&
                isWebSafePixelFormat(probe.video.pixelFormat) &&
                WEB_SAFE_H264_PROFILES.has(probe.video.profile ?? '') &&
                Math.max(width, height) <= maxEdgePx &&
                probe.video.frameRate <= MAX_VIDEO_FPS + 0.5 &&
                (!probe.audio ||
                    (probe.audio.codec === 'aac' && probe.audio.channels <= 2)) &&
                probe.bitRate <= tier.skipBps;

            if (alreadyWebReady) {
                // Untouched bytes, zero work, zero generational loss — the true analogue of the
                // GIF path's short-circuit. Only when the container is right AND the index is
                // already at the front, because both are things a player depends on.
                if (isMp4Brand(source) && hasFastStart(source)) {
                    return asOutput(source);
                }
                // Everything about the encode is fine but the wrapper is not: either `moov` is
                // at the end (so a browser must download all 200MB before the first frame) or
                // this is a `qt`-brand iPhone `.mov`, whose bytes must not be served under a
                // `.mp4` key. A stream copy fixes both for the price of the I/O.
                return remux();
            }

            // Video's budget is bitrate × duration. A caller-supplied byte target that is below
            // what the source's own resolution is worth would force a pointless quality cut, so
            // it acts as a floor rather than a ceiling.
            const effectiveTarget = Math.max(
                targetSize,
                Math.round((probe.durationSeconds * tier.targetBps) / 8),
            );

            let plan = this.buildTranscodePlan(probe, tier, qualityToCrf(quality), maxEdgePx);
            let encoded = await this.encodeVideo(inputPath, dir, 0, probe, plan);

            // At most ONE retry, unlike the sharp loops' five. Those re-encodes cost 50-300ms
            // each; this one costs 1-3 minutes, and it costs it on the only media worker slot
            // there is. Three speculative passes is six minutes of every other user's
            // thumbnails waiting behind a file whose caller was already warned about the size.
            const needsRefine = encoded.length > effectiveTarget * VIDEO_TARGET_TOLERANCE;
            const canRefine = plan.tier !== VIDEO_BITRATE_LADDER[0] || plan.crf < VIDEO_CRF_MAX;

            if (needsRefine && canRefine) {
                // Move BOTH knobs, weighted toward resolution. At constant CRF bitrate scales
                // roughly linearly with pixel count but only as 2^(ΔCRF/6) with quality — so
                // one step down the ladder is worth ~2.2x while +4 CRF is worth ~1.6x.
                // Together ~3.5x, which closes any realistic gap in a single shot.
                const refined = this.stepDownPlan(plan, probe);
                // Re-encode from the ORIGINAL, never from the previous output: chaining lossy
                // H.264 makes the second encoder spend bits faithfully reproducing the first
                // one's blocking — strictly worse output for strictly more CPU.
                const retry = await this.encodeVideo(inputPath, dir, 1, probe, refined);
                if (retry.length < encoded.length) {
                    plan = refined;
                    encoded = retry;
                }
            }

            // A source that failed the skip test only on RESOLUTION can still come out bigger
            // after a re-encode — a heavily compressed 480p clip re-encoded at CRF 21 lands
            // 2-3x larger. That is exactly the "you compressed my already-compressed video"
            // complaint, so it must not be shipped. Fall back to the stream copy rather than the
            // raw bytes so the container and faststart stay correct while spending nothing.
            if (encoded.length >= source.length) {
                return remux();
            }

            return asOutput(encoded, {
                width: plan.outputWidth,
                height: plan.outputHeight,
                bitRate: Math.round((encoded.length * 8) / probe.durationSeconds),
                reencoded: true,
            });
        });
    }

    /** One capped-CRF encode at the given plan, returning the produced bytes. */
    private async encodeVideo(
        inputPath: string,
        dir: string,
        pass: number,
        probe: VideoProbe,
        plan: TranscodePlan,
    ): Promise<Buffer> {
        const outputPath = path.join(dir, `out-${pass}.mp4`);
        await transcodeToMp4(inputPath, outputPath, {
            crf: plan.crf,
            preset: VIDEO_PRESET,
            scale: plan.scale,
            fps: plan.fps,
            sourceFps: probe.video.frameRate,
            maxrateBps: plan.tier.maxrateBps,
            audio: plan.audio,
            timeoutMs: encodeTimeoutMs(probe.durationSeconds),
        });
        return fs.readFile(outputPath);
    }

    private buildTranscodePlan(
        probe: VideoProbe,
        tier: VideoTier,
        crf: number,
        maxEdgePx: number,
    ): TranscodePlan {
        const { width, height, frameRate } = probe.video;
        const fitted = fitInside(width, height, maxEdgePx);
        // Omit the filter entirely when the source already fits AND has even dimensions —
        // there is nothing to do and the scale pass is not free.
        const needsScale = fitted.width !== width || fitted.height !== height;

        return {
            crf,
            tier,
            scale: needsScale ? fitted : null,
            // Never upsample: a 24fps film-look clip stays 24fps.
            fps: frameRate > MAX_VIDEO_FPS + 0.5 ? MAX_VIDEO_FPS : null,
            outputWidth: fitted.width,
            outputHeight: fitted.height,
            audio: resolveAudioPlan(probe),
        };
    }

    /** One tier down the ladder plus +4 CRF — see the refine comment in {@link optimizeVideo}. */
    private stepDownPlan(plan: TranscodePlan, probe: VideoProbe): TranscodePlan {
        const currentIndex = VIDEO_BITRATE_LADDER.indexOf(plan.tier);
        const nextTier = VIDEO_BITRATE_LADDER[Math.max(0, currentIndex - 1)]!;

        // Rescale by PIXEL budget rather than by edge, so the step means the same thing for a
        // portrait clip and a 21:9 one.
        const currentPixels = plan.outputWidth * plan.outputHeight;
        const factor = Math.min(1, Math.sqrt(nextTier.maxPixels / currentPixels));
        const nextEdge = Math.max(
            2,
            Math.floor(Math.max(plan.outputWidth, plan.outputHeight) * factor),
        );
        const fitted = fitInside(probe.video.width, probe.video.height, nextEdge);

        return {
            ...plan,
            crf: Math.min(VIDEO_CRF_MAX, plan.crf + 4),
            tier: nextTier,
            scale: fitted,
            outputWidth: fitted.width,
            outputHeight: fitted.height,
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
