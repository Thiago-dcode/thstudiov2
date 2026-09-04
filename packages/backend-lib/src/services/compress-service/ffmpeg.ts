import { execFile } from 'child_process';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { VideoProbe } from './types';

const execFileAsync = promisify(execFile);

/**
 * `ffmpeg-static` and `ffprobe-static` ship real executables inside `node_modules`. Two things
 * break that in production, and both are silent until the first upload:
 *
 *   - an image that copies only `dist/` has no binary to point at;
 *   - the shipped builds are glibc-linked, so an Alpine base needs `libc6-compat`. The worker
 *     runs on `node:22-bookworm-slim`, which is fine — do not "optimise" it to Alpine without
 *     adding that package.
 *
 * Failing loudly here, at module load, beats failing halfway through a user's video.
 */
if (!ffmpegStatic) {
    throw new Error('ffmpeg-static did not resolve a binary path');
}
export const FFMPEG_BIN: string = ffmpegStatic;
export const FFPROBE_BIN: string = ffprobeStatic.path;

ffmpeg.setFfmpegPath(FFMPEG_BIN);
ffmpeg.setFfprobePath(FFPROBE_BIN);

const FFPROBE_TIMEOUT_MS = 30_000;

/**
 * `ftyp` brands that are unambiguously MP4. `qt  ` is excluded on purpose: an iPhone `.mov` is
 * H.264/AAC in an ISO-BMFF container, but its brand is QuickTime and some players reject those
 * bytes when served as `video/mp4`. Since S3 derives ContentType from the stored key extension
 * (see `S3StorageService`), a `qt` file under a `.mp4` key is a genuine format mismatch — the
 * same class of bug already documented on the WebP path. Such files get remuxed, not passed
 * through.
 */
const MP4_BRANDS = new Set([
    'isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'dash', 'mmp4', 'M4V ',
]);

export const isMp4Brand = (buffer: Buffer): boolean =>
    buffer.length >= 12 &&
    buffer.toString('latin1', 4, 8) === 'ftyp' &&
    MP4_BRANDS.has(buffer.toString('latin1', 8, 12));

/**
 * Walks the top-level ISO-BMFF boxes looking for whether `moov` precedes `mdat`. Reads box
 * headers only, never payload, so it costs microseconds even on a 300MB buffer.
 *
 * This is what "faststart" means, and it is worth checking rather than assuming: with `moov`
 * at the end a browser has no index until the whole file has landed, so a 200MB video shows
 * nothing at all until the last byte arrives. With it at the front, playback starts after the
 * first range request.
 */
export function hasFastStart(buffer: Buffer): boolean {
    let offset = 0;
    while (offset + 8 <= buffer.length) {
        let size = buffer.readUInt32BE(offset);
        const type = buffer.toString('latin1', offset + 4, offset + 8);
        let header = 8;

        if (size === 1) {
            // 64-bit extended size, stored in the 8 bytes after the type.
            if (offset + 16 > buffer.length) return false;
            size = Number(buffer.readBigUInt64BE(offset + 8));
            header = 16;
        } else if (size === 0) {
            // A zero size means the box runs to EOF, so nothing can follow it.
            size = buffer.length - offset;
        }

        if (type === 'moov') return true;
        if (type === 'mdat') return false;
        if (size < header) return false; // malformed — stop rather than loop forever
        offset += size;
    }
    return false;
}

/**
 * Fits a frame inside a square box without ever enlarging it, rounding both edges DOWN to even.
 *
 * The even rounding is not cosmetic: H.264 with `yuv420p` chroma subsampling requires even
 * dimensions on both axes, and libx264 fails outright on an odd one. Sources with odd coded
 * heights (1080x607 and friends) are real, so this runs even when no downscale is needed.
 *
 * Deliberately not `scale=...:force_original_aspect_ratio=decrease`: that filter *enlarges* an
 * input smaller than the box — there is no `withoutEnlargement` equivalent — so a 640x360 clip
 * would be blown up to 1920x1080 and encoded at 1080p prices for 360p of detail.
 */
export function fitInside(
    width: number,
    height: number,
    maxEdge: number,
): { width: number; height: number } {
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const even = (value: number) => Math.max(2, Math.floor((value * scale) / 2) * 2);
    return { width: even(width), height: even(height) };
}

/**
 * ffprobe reports frame rates as rationals. `avg_frame_rate` is `"0/0"` on some streams (a
 * single-frame video, or a container that never wrote the value), which is why the caller
 * falls back to `r_frame_rate` and then to 30.
 */
export function parseFrameRate(value: string | undefined | null): number | null {
    if (!value) return null;
    const [numerator, denominator] = value.split('/').map(Number);
    if (!numerator || !denominator) return null;
    const rate = numerator / denominator;
    return Number.isFinite(rate) && rate > 0 ? rate : null;
}

type FfprobeStream = {
    codec_type?: string;
    codec_name?: string;
    profile?: string;
    pix_fmt?: string;
    width?: number;
    height?: number;
    avg_frame_rate?: string;
    r_frame_rate?: string;
    sample_aspect_ratio?: string;
    channels?: number;
    sample_rate?: string;
    bit_rate?: string;
    duration?: string;
    tags?: Record<string, string>;
    side_data_list?: Array<{ rotation?: number }>;
};

/**
 * Degrees the player will rotate the frame by, from the display matrix (`side_data_list`) with
 * the legacy `tags.rotate` as a fallback. ffmpeg applies this itself before any filter runs
 * (`-autorotate` is on by default), so our scale filter has to be computed against the rotated
 * axes or a portrait clip comes out squashed.
 */
function rotationDegrees(stream: FfprobeStream): number {
    const fromSideData = stream.side_data_list?.find(
        (entry) => typeof entry.rotation === 'number',
    )?.rotation;
    const raw = fromSideData ?? Number(stream.tags?.rotate ?? 0);
    if (!Number.isFinite(raw)) return 0;
    return ((Math.round(raw) % 360) + 360) % 360;
}

/** Square-pixel display dimensions: SAR applied, then the rotation swap. */
function displayDimensions(stream: FfprobeStream): { width: number; height: number } {
    const codedWidth = stream.width ?? 0;
    const codedHeight = stream.height ?? 0;

    // Anamorphic sources store non-square pixels; without this a 1440x1080 DV frame (SAR 4:3)
    // would be treated as 4:3 when it displays as 16:9, so `shape` and `aspect_ratio` would
    // both be wrong on the stored row.
    const [sarNum, sarDen] = (stream.sample_aspect_ratio ?? '1:1').split(':').map(Number);
    const sar = sarNum && sarDen ? sarNum / sarDen : 1;
    const width = Math.round(codedWidth * (sar > 0 ? sar : 1));

    const rotation = rotationDegrees(stream);
    return rotation === 90 || rotation === 270
        ? { width: codedHeight, height: width }
        : { width, height: codedHeight };
}

/**
 * Runs ffprobe directly rather than through fluent-ffmpeg's `ffprobe()` helper, which has no
 * timeout and an untyped result.
 */
export async function probeVideo(filePath: string): Promise<VideoProbe> {
    const { stdout } = await execFileAsync(
        FFPROBE_BIN,
        ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath],
        {
            timeout: FFPROBE_TIMEOUT_MS,
            // Node's 1MB default throws ERR_CHILD_PROCESS_STDIO_MAXBUFFER on files carrying many
            // streams or chapters, which is ordinary camera output rather than an edge case.
            maxBuffer: 8 * 1024 * 1024,
        },
    );

    const parsed = JSON.parse(stdout) as {
        format?: { format_name?: string; duration?: string; size?: string; bit_rate?: string };
        streams?: FfprobeStream[];
    };

    const streams = parsed.streams ?? [];
    const videoStream = streams.find((stream) => stream.codec_type === 'video');
    if (!videoStream) {
        throw new Error('No video stream found in the uploaded file');
    }
    const audioStream = streams.find((stream) => stream.codec_type === 'audio');

    const durationSeconds =
        Number(parsed.format?.duration) || Number(videoStream.duration) || 0;
    if (!durationSeconds) {
        // Everything downstream — the bitrate budget, the encode timeout, the poster seek — is
        // priced per second, so there is nothing sensible to do without a duration.
        throw new Error('Could not determine the video duration');
    }

    const sizeBytes = Number(parsed.format?.size) || 0;
    const bitRate =
        Number(parsed.format?.bit_rate) ||
        (sizeBytes ? Math.round((sizeBytes * 8) / durationSeconds) : 0);

    const { width, height } = displayDimensions(videoStream);

    return {
        container: parsed.format?.format_name ?? '',
        durationSeconds,
        sizeBytes,
        bitRate,
        video: {
            codec: videoStream.codec_name ?? '',
            profile: videoStream.profile ?? null,
            pixelFormat: videoStream.pix_fmt ?? null,
            codedWidth: videoStream.width ?? 0,
            codedHeight: videoStream.height ?? 0,
            width,
            height,
            frameRate:
                parseFrameRate(videoStream.avg_frame_rate) ??
                parseFrameRate(videoStream.r_frame_rate) ??
                30,
        },
        audio: audioStream
            ? {
                codec: audioStream.codec_name ?? '',
                channels: audioStream.channels ?? 0,
                sampleRate: Number(audioStream.sample_rate) || 0,
                bitRate: Number(audioStream.bit_rate) || null,
            }
            : null,
    };
}

/**
 * One temp directory per call.
 *
 * `mkdtemp` rather than a predictable `/tmp/video-<media_id>.mp4`: collision-free if the worker
 * concurrency is ever raised above one, and unguessable, which closes a symlink-swap window.
 * Cleanup is a single recursive remove, so it cannot miss a file the refine pass created.
 *
 * Peak disk is the source plus one output — roughly 600MB at the upload cap — and `/tmp` is
 * often a small tmpfs (i.e. RAM) inside a container. `VIDEO_TMP_DIR` is the escape hatch.
 */
export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
    const base = process.env.VIDEO_TMP_DIR || os.tmpdir();
    const dir = await fs.mkdtemp(path.join(base, 'thstudio-vid-'));
    try {
        return await fn(dir);
    } finally {
        // Swallowed on purpose: a cleanup failure must never replace the real error on the way
        // out, which is what the user sees as `failed_reason`.
        await fs.rm(dir, { recursive: true, force: true }).catch(() => { });
    }
}

export async function writeTempFile(
    dir: string,
    name: string,
    buffer: Buffer,
): Promise<string> {
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, buffer);
    return filePath;
}

/**
 * An 8x-realtime budget. `veryfast` runs 2-6x faster than realtime on a modern core and roughly
 * 1-2x on a shared vCPU, so this only fires on something genuinely stuck. The 15-minute ceiling
 * exists because the media worker runs at BullMQ's default concurrency of one — a hung encode
 * stalls every other media job behind it.
 */
export const encodeTimeoutMs = (durationSeconds: number): number =>
    Math.min(900_000, Math.max(60_000, Math.round(durationSeconds * 8_000)));

export const POSTER_TIMEOUT_MS = 60_000;
export const REMUX_TIMEOUT_MS = 300_000;

function run(command: FfmpegCommand, timeoutMs: number, label: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let lastStderrLine = '';
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            // SIGKILL rather than SIGTERM: a wedged libx264 can sit inside a non-interruptible
            // encode loop, and this timer is the only thing between it and a blocked queue.
            command.kill('SIGKILL');
        }, timeoutMs);

        command
            .on('stderr', (line: string) => {
                lastStderrLine = line;
            })
            .on('end', () => {
                clearTimeout(timer);
                resolve();
            })
            .on('error', (error: Error) => {
                clearTimeout(timer);
                // The media processor surfaces `error.message` verbatim as the user-visible
                // `failed_reason`, so keep the last stderr line and never a temp path.
                reject(
                    new Error(
                        timedOut
                            ? `${label} timed out after ${Math.round(timeoutMs / 1000)}s`
                            : `${label} failed: ${lastStderrLine || error.message}`,
                    ),
                );
            })
            .run();
    });
}

/**
 * Container-only rewrite: the video and audio bitstreams are copied byte for byte, so this is
 * not a re-encode and costs nothing but I/O — a few seconds even on 300MB. Used to move `moov`
 * to the front, and to lift an already-good `qt`-brand `.mov` into a real MP4.
 */
export async function remuxToMp4(input: string, output: string): Promise<void> {
    await run(
        ffmpeg(input)
            .outputOptions(['-c', 'copy', '-movflags', '+faststart', '-f', 'mp4'])
            .output(output),
        REMUX_TIMEOUT_MS,
        'Video remux',
    );
}

export async function extractPosterFrame(
    input: string,
    output: string,
    options: {
        seekSeconds: number;
        scale: { width: number; height: number } | null;
    },
): Promise<void> {
    const filters = ['setsar=1'];
    if (options.scale) {
        filters.unshift(`scale=${options.scale.width}:${options.scale.height}:flags=lanczos`);
    }

    await run(
        ffmpeg(input)
            // `.seekInput` (`-ss` BEFORE `-i`), never `.seek` — the latter is an OUTPUT seek,
            // which decodes every frame from zero and turns a poster grab on a ten-minute file
            // into a multi-minute decode. This is the single most common fluent-ffmpeg mistake.
            .seekInput(options.seekSeconds)
            .outputOptions([
                '-map', '0:v:0',
                '-frames:v', '1',
                '-vf', filters.join(','),
                // Lossless PNG, because the frame is about to go through Sharp's WebP encoder
                // anyway and a JPEG here would stack one lossy pass on top of another.
                '-c:v', 'png',
                '-f', 'image2',
            ])
            .output(output),
        POSTER_TIMEOUT_MS,
        'Poster frame extraction',
    );
}

export type TranscodeAudioPlan =
    | { mode: 'none' }
    | { mode: 'copy' }
    | { mode: 'encode'; bitrateBps: number; channels: number; sampleRate: number | null };

export type TranscodeOptions = {
    crf: number;
    preset: string;
    /** null when the source is already inside the cap — emit no scale filter, never upscale. */
    scale: { width: number; height: number } | null;
    /** null when the source is already at or under the fps cap — never upsample. */
    fps: number | null;
    /** Source frame rate, used to size the GOP. */
    sourceFps: number;
    maxrateBps: number;
    audio: TranscodeAudioPlan;
    timeoutMs: number;
};

export async function transcodeToMp4(
    input: string,
    output: string,
    options: TranscodeOptions,
): Promise<void> {
    const outputFps = options.fps ?? options.sourceFps;

    // Filter order matters: dropping frames before scaling means scaling half as many of them.
    const filters: string[] = [];
    if (options.fps) filters.push(`fps=${options.fps}`);
    if (options.scale) {
        filters.push(`scale=${options.scale.width}:${options.scale.height}:flags=lanczos`);
    }
    // Anamorphic sources otherwise keep a display aspect ratio that disagrees with the coded
    // one, which makes the poster — and therefore the stored shape/aspect_ratio — wrong.
    filters.push('setsar=1');

    const args = [
        // Not cosmetic. Phone footage carries an embedded cover-art still as a second video
        // stream, and GoPro/DJI files carry a `bin_data` telemetry track that MP4 cannot hold;
        // without explicit mapping ffmpeg tries to copy them and the encode fails outright.
        '-map', '0:v:0',
        ...(options.audio.mode === 'none' ? [] : ['-map', '0:a:0']),
        '-c:v', 'libx264',
        '-preset', options.preset,
        '-crf', String(options.crf),
        // Capped CRF: quality drives the encode everywhere, and the VBV only engages on the
        // pathological high-complexity segments that would otherwise blow the budget. A 2-second
        // buffer is the streaming standard; a 1-second one clamps visibly on every hard cut.
        '-maxrate', String(options.maxrateBps),
        '-bufsize', String(options.maxrateBps * 2),
        // The ceiling every browser and mobile SoC decodes in hardware. At <=1080p30 and
        // <=8.5 Mbps we are inside its limits, so it never forces libx264 to re-plan.
        '-profile:v', 'high',
        '-level', '4.1',
        '-pix_fmt', 'yuv420p',
        '-vf', filters.join(','),
        // Fixed 2-second GOP: seekable at 2s granularity and segment-friendly if HLS is ever
        // added, for about 2% of bitrate.
        '-g', String(Math.max(1, Math.round(outputFps * 2))),
        '-keyint_min', String(Math.max(1, Math.round(outputFps))),
        '-sc_threshold', '0',
        ...audioArgs(options.audio),
        // A second pass over the output to relocate `moov` to the front. Costs seconds of I/O
        // and is the entire reason playback starts before the download finishes.
        '-movflags', '+faststart',
        // `-threads 0` reads the HOST core count and oversubscribes inside a cgroup-limited
        // container, which makes it slower rather than faster.
        '-threads', String(Math.min(4, os.cpus().length || 1)),
        '-f', 'mp4',
    ];

    await run(
        ffmpeg(input).outputOptions(args).output(output),
        options.timeoutMs,
        'Video transcode',
    );
}

function audioArgs(plan: TranscodeAudioPlan): string[] {
    switch (plan.mode) {
        // Explicit rather than relying on ffmpeg's implicit behaviour: without it the `-map
        // 0:a:0` above fails the stream map on a silent source.
        case 'none':
            return ['-an'];
        // Already web-safe AAC. Copying it avoids a whole generation of audio loss for free,
        // even though the video alongside it is being re-encoded.
        case 'copy':
            return ['-c:a', 'copy'];
        case 'encode':
            return [
                '-c:a', 'aac',
                '-b:a', String(plan.bitrateBps),
                '-ac', String(plan.channels),
                // Left alone at 44.1k and 48k — the AAC encoder handles both natively and
                // resampling between them is a needless generation of loss.
                ...(plan.sampleRate ? ['-ar', String(plan.sampleRate)] : []),
            ];
    }
}
