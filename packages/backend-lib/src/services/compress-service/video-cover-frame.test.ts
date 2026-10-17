import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { VIDEO_PREVIEW_FRAME_PERCENTAGES } from '@repo/common-lib/constants/limits';
import { FFMPEG_BIN } from './ffmpeg';
import { SharpCompressService } from './sharp-compress.service';

/**
 * Runs the real ffmpeg binary over the clip the feature exists for: one that opens on black. A
 * second of black then a second of white, so "which frame did we get" is a brightness check.
 */
describe('video cover frame', () => {
    let dir: string;
    let video: Buffer;
    const service = new SharpCompressService({ driver: 'sharp' });
    const encode = { targetSize: 50 * 1024, quality: 80, maxEdgePx: 64 };

    const meanBrightness = async (frame: Buffer): Promise<number> => {
        const { channels } = await sharp(frame).stats();
        return channels[0]!.mean;
    };

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'a11-cover-frame-'));
        const output = join(dir, 'fade-in.mp4');
        execFileSync(FFMPEG_BIN, [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=25:d=1',
            '-f', 'lavfi', '-i', 'color=c=white:s=64x64:r=25:d=1',
            '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', output,
        ]);
        video = readFileSync(output);
    }, 60_000);

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('puts the picked cover first and still samples every percentage after it', async () => {
        const frames = await service.extractVideoFrames({
            file: video,
            poster: encode,
            sample: encode,
            posterSeconds: 1.5,
        });

        expect(frames).toHaveLength(VIDEO_PREVIEW_FRAME_PERCENTAGES.length + 1);
        expect(frames[0]!.seekSeconds).toBe(1.5);
        expect(await meanBrightness(frames[0]!.buffer)).toBeGreaterThan(200);
    }, 60_000);

    it('keeps the default layout when no cover was picked', async () => {
        const frames = await service.extractVideoFrames({
            file: video,
            poster: encode,
            sample: encode,
        });

        expect(frames).toHaveLength(VIDEO_PREVIEW_FRAME_PERCENTAGES.length);
        // The default inset (min(1s, duration / 10)) — 0.2s into this clip, still in the black.
        expect(frames[0]!.seekSeconds).toBeCloseTo(0.2, 5);
        expect(await meanBrightness(frames[0]!.buffer)).toBeLessThan(50);
    }, 60_000);

    it('takes a single frame at the exact second asked for', async () => {
        const frame = await service.extractVideoFrameAt({ file: video, seconds: 0.5, encode });

        expect(frame.seekSeconds).toBe(0.5);
        expect(await meanBrightness(frame.buffer)).toBeLessThan(50);
    }, 60_000);

    /**
     * The browser's `video.duration` is the longest track, so the slider lets the artist pick a
     * second where only the audio is left. Phone clips do this routinely; it must not fail the
     * upload — ffmpeg writes no frame there and exits cleanly.
     */
    describe('when the audio outlasts the picture', () => {
        const withLongAudio = (container: 'mp4' | 'webm') => {
            const output = join(dir, `long-audio.${container}`);
            const codecs =
                container === 'mp4'
                    ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac']
                    : ['-c:v', 'libvpx-vp9', '-b:v', '200k', '-c:a', 'libopus'];
            execFileSync(FFMPEG_BIN, [
                '-hide_banner', '-loglevel', 'error', '-y',
                '-f', 'lavfi', '-i', 'color=c=white:s=64x64:r=25:d=2',
                '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3.5',
                ...codecs, output,
            ]);
            return readFileSync(output);
        };

        it('clamps to the last picture when the container records the stream length', async () => {
            const frame = await service.extractVideoFrameAt({
                file: withLongAudio('mp4'),
                seconds: 3.3,
                encode,
            });

            expect(frame.seekSeconds).toBeLessThan(2);
            expect(await meanBrightness(frame.buffer)).toBeGreaterThan(200);
        }, 60_000);

        it('steps back to a frame that decodes when only the format length is known', async () => {
            const frames = await service.extractVideoFrames({
                file: withLongAudio('webm'),
                poster: encode,
                sample: encode,
                posterSeconds: 3.3,
            });

            expect(frames).toHaveLength(VIDEO_PREVIEW_FRAME_PERCENTAGES.length + 1);
            // Whatever second it settled on, it is one that has a picture — and it says so.
            expect(frames[0]!.seekSeconds).toBeLessThan(2);
            expect(frames.every((f) => f.size > 0)).toBe(true);
        }, 60_000);
    });

    it('clamps a second past the end onto the last frame instead of returning nothing', async () => {
        const frame = await service.extractVideoFrameAt({ file: video, seconds: 99, encode });

        expect(frame.seekSeconds).toBeLessThan(2);
        expect(frame.seekSeconds).toBeGreaterThan(1.9);
        expect(frame.size).toBeGreaterThan(0);
        expect(await meanBrightness(frame.buffer)).toBeGreaterThan(200);
    }, 60_000);
});
