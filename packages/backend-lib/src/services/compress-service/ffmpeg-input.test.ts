import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FFMPEG_BIN, probeVideo } from './ffmpeg';

describe('ffmpeg input restrictions', () => {
    let dir: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'a11-ffmpeg-input-'));
        execFileSync(FFMPEG_BIN, [
            '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=64x64:rate=25',
            '-f', 'mpegts', '-y', join(dir, 'segment.ts'),
        ]);
        execFileSync(FFMPEG_BIN, [
            '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=64x64:rate=25',
            '-y', join(dir, 'real.mp4'),
        ]);
        // An HLS playlist uploaded as `.mp4`: unrestricted, ffprobe follows it to another file.
        writeFileSync(
            join(dir, 'playlist.mp4'),
            `#EXTM3U\n#EXT-X-TARGETDURATION:1\n#EXTINF:1,\nfile:${join(dir, 'segment.ts')}\n#EXT-X-ENDLIST\n`,
        );
    });

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('still probes a real MP4', async () => {
        await expect(probeVideo(join(dir, 'real.mp4'))).resolves.toMatchObject({ video: { width: 64, height: 64 } });
    });

    it('refuses a playlist disguised as a video instead of following it', async () => {
        await expect(probeVideo(join(dir, 'playlist.mp4'))).rejects.toThrow(/not on whitelist/);
    });
});
