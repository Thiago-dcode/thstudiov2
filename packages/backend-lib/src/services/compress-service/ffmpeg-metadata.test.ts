import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FFMPEG_BIN, FFPROBE_BIN, remuxToMp4, transcodeToMp4 } from './ffmpeg';

/**
 * Runs the real ffmpeg binary: phone footage carries the recording GPS position, and a published
 * video must never hand it to visitors (see `STRIP_METADATA`).
 */
describe('video metadata stripping', () => {
    let dir: string;
    let source: string;

    const tagsAndRotation = (file: string): string =>
        execFileSync(FFPROBE_BIN, ['-v', 'error', '-show_format', '-show_streams', file], {
            encoding: 'utf8',
        });

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'a11-ffmpeg-meta-'));
        const plain = join(dir, 'plain.mov');
        source = join(dir, 'phone.mov');
        const quiet = ['-hide_banner', '-loglevel', 'error', '-y'];
        execFileSync(FFMPEG_BIN, [
            ...quiet,
            '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=30',
            '-f', 'lavfi', '-i', 'sine=frequency=440',
            '-t', '1', '-c:v', 'libx264', '-c:a', 'aac', plain,
        ]);
        // What an iPhone writes: GPS position, device tags, and a portrait display matrix.
        execFileSync(FFMPEG_BIN, [
            ...quiet,
            '-display_rotation', '90', '-i', plain, '-c', 'copy',
            '-metadata', 'location=+40.4168-003.7038/',
            '-metadata', 'com.apple.quicktime.location.ISO6709=+40.4168-003.7038+650.000/',
            '-metadata', 'make=Apple',
            '-movflags', 'use_metadata_tags',
            source,
        ]);
        expect(tagsAndRotation(source)).toContain('40.4168');
    }, 60_000);

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('remux drops the GPS position and device tags but keeps the orientation', async () => {
        const output = join(dir, 'remux.mp4');
        await remuxToMp4(source, output);

        const probe = tagsAndRotation(output);
        expect(probe).not.toContain('40.4168');
        expect(probe).not.toMatch(/TAG:make=/);
        expect(probe).toMatch(/rotation=-?90/);
    }, 60_000);

    it('transcode drops the GPS position and device tags', async () => {
        const output = join(dir, 'transcode.mp4');
        await transcodeToMp4(source, output, {
            crf: 28,
            preset: 'ultrafast',
            scale: null,
            fps: null,
            sourceFps: 30,
            maxrateBps: 1_000_000,
            audio: { mode: 'copy' },
            timeoutMs: 60_000,
        });

        const probe = tagsAndRotation(output);
        expect(probe).not.toContain('40.4168');
        expect(probe).not.toMatch(/TAG:make=/);
    }, 60_000);
});
