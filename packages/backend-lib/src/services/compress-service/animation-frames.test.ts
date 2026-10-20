import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { FFMPEG_BIN } from './ffmpeg';
import { SharpCompressService } from './sharp-compress.service';

describe('SharpCompressService.sampleAnimationFrames', () => {
    const service = new SharpCompressService();
    let dir: string;
    let gif: Buffer;
    let still: Buffer;

    beforeAll(async () => {
        dir = mkdtempSync(join(tmpdir(), 'a11-gif-frames-'));
        execFileSync(FFMPEG_BIN, [
            '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=3:size=320x240:rate=10',
            '-y', join(dir, 'anim.gif'),
        ]);
        gif = readFileSync(join(dir, 'anim.gif'));
        still = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } })
            .png()
            .toBuffer();
    });

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('samples distinct frames across the whole animation, scaled down as JPEG', async () => {
        const frames = await service.sampleAnimationFrames(gif, 5, 160);
        expect(frames).toHaveLength(5);
        const metas = await Promise.all(frames.map((frame) => sharp(frame).metadata()));
        metas.forEach((meta) => {
            expect(meta.format).toBe('jpeg');
            expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(160);
        });
        // testsrc changes every frame, so first and last must differ.
        expect(frames[0]!.equals(frames[4]!)).toBe(false);
    });

    it('returns nothing for a still image, which is moderated as itself', async () => {
        await expect(service.sampleAnimationFrames(still, 5, 160)).resolves.toEqual([]);
    });
});
