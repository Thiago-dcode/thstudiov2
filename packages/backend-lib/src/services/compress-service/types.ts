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

export type CompressionOutput = {
    filename: string,
    size: number,
    buffer: Buffer,
    /**
     * False when the source bytes were handed straight back rather than encoded. Optional because
     * only the paths that CAN pass a source through report it — {@link VideoCompressionOutput}
     * makes it required.
     *
     * Log it. Without it "compressed to 1.5MB" and "gave you back the 1.5MB you uploaded" are the
     * same line, and telling those two apart is the whole of diagnosing a compression level that
     * does nothing.
     */
    reencoded?: boolean,
}

/** How one extracted frame is encoded. */
export type VideoFrameEncodeOptions = {
    /** Target file size in bytes. */
    targetSize: number;
    /** WebP quality, 0-100. */
    quality: number;
    /** Longest edge kept. */
    maxEdgePx: number;
};

/**
 * Input for `extractVideoFrames`. Named rather than positional because everything after the
 * source is a bare number or array of them: `(file, 122880, 80)` and `(file, 80, 122880)` both
 * compile, and only one of them is a thumbnail.
 *
 * `poster` and `sample` are separate for the same reason they are named: the two kinds of frame
 * are not the same asset and must not be encoded as if they were. See each field.
 */
export type ExtractVideoFramesInput = {
    /** Multer upload or raw video bytes. */
    file: Express.Multer.File | Buffer;
    /**
     * Where to sample, as percentages of the video: 0 is the first frame, 100 the last, 50 the
     * middle. One WebP comes back per entry, in the order given — pass 10 percentages and 10
     * frames are extracted. Defaults to `VIDEO_PREVIEW_FRAME_PERCENTAGES`, whose length is the
     * configured preview count.
     */
    percentages?: readonly number[];
    /**
     * Frame 0 only, and it is the media's THUMBNAIL: the grid tile, the `og:image`, the sitemap
     * image. Give it the same budget a still image's thumbnail gets — a person looks at this one.
     */
    poster: VideoFrameEncodeOptions;
    /**
     * Frames 1..N. These are model input and nothing else — the moderation verdict and the SEO
     * description are drawn from them, and no page ever renders one. Compress them hard.
     */
    sample: VideoFrameEncodeOptions;
};

/**
 * ffprobe output, normalised. Internal to the ffmpeg driver — no abstract exposes it.
 *
 * `video.width`/`height` are DISPLAY dimensions: the rotation matrix and sample aspect ratio
 * have already been applied, so they are what a player actually shows. `codedWidth`/`codedHeight`
 * are the raw stored values and are almost never what you want — an iPhone portrait clip is
 * coded 1920x1080 with a 90° display matrix, and computing a scale filter from that produces a
 * squashed video.
 */
export type VideoProbe = {
    /** ffprobe `format_name`, a comma list e.g. "mov,mp4,m4a,3gp,3g2,mj2". */
    container: string;
    durationSeconds: number;
    sizeBytes: number;
    /** Total bits/s across all streams. Falls back to `sizeBytes * 8 / duration`. */
    bitRate: number;
    video: {
        codec: string;
        profile: string | null;
        pixelFormat: string | null;
        codedWidth: number;
        codedHeight: number;
        width: number;
        height: number;
        frameRate: number;
    };
    audio: {
        codec: string;
        channels: number;
        sampleRate: number;
        bitRate: number | null;
    } | null;
};

export type VideoCompressionOutput = CompressionOutput & {
    /** Square-pixel dimensions of the stored MP4. */
    width: number;
    height: number;
    durationSeconds: number;
    bitRate: number;
    /**
     * False when the source was handed back untouched or only stream-copy remuxed. Log it:
     * this is the single observable that tells you the "already compressed" skip is firing.
     */
    reencoded: boolean;
};

