import { fitInside, hasFastStart, isMp4Brand, parseFrameRate } from './ffmpeg';

/** Builds a minimal ISO-BMFF top-level box chain: `[size][type]` headers with empty payloads. */
const boxes = (...types: string[]): Buffer =>
    Buffer.concat(
        types.map((type) => {
            const box = Buffer.alloc(8);
            box.writeUInt32BE(8, 0);
            box.write(type, 4, 'latin1');
            return box;
        }),
    );

const ftyp = (brand: string): Buffer => {
    const box = Buffer.alloc(16);
    box.writeUInt32BE(16, 0);
    box.write('ftyp', 4, 'latin1');
    box.write(brand, 8, 'latin1');
    return box;
};

describe('hasFastStart', () => {
    it('is true when moov precedes mdat', () => {
        expect(hasFastStart(boxes('ftyp', 'moov', 'mdat'))).toBe(true);
    });

    it('is false when mdat comes first — the player has no index until the last byte lands', () => {
        expect(hasFastStart(boxes('ftyp', 'mdat', 'moov'))).toBe(false);
    });

    it('walks past a 64-bit extended-size box', () => {
        // `size === 1` means the real size lives in the 8 bytes after the type.
        const big = Buffer.alloc(24);
        big.writeUInt32BE(1, 0);
        big.write('free', 4, 'latin1');
        big.writeBigUInt64BE(24n, 8);
        expect(hasFastStart(Buffer.concat([big, boxes('moov')]))).toBe(true);
    });

    it('stops rather than looping on a malformed box size', () => {
        const bad = Buffer.alloc(8);
        bad.writeUInt32BE(4, 0); // smaller than its own 8-byte header
        bad.write('junk', 4, 'latin1');
        expect(hasFastStart(Buffer.concat([bad, boxes('moov')]))).toBe(false);
    });

    it('is false for a truncated buffer with neither box', () => {
        expect(hasFastStart(Buffer.alloc(4))).toBe(false);
        expect(hasFastStart(boxes('ftyp', 'free'))).toBe(false);
    });
});

describe('isMp4Brand', () => {
    it('accepts the ISO base-media brands', () => {
        expect(isMp4Brand(ftyp('isom'))).toBe(true);
        expect(isMp4Brand(ftyp('mp42'))).toBe(true);
    });

    it('rejects `qt  `, so an iPhone .mov is remuxed rather than served as video/mp4', () => {
        expect(isMp4Brand(ftyp('qt  '))).toBe(false);
    });

    it('rejects anything without an ftyp box', () => {
        expect(isMp4Brand(boxes('moov', 'mdat'))).toBe(false);
        expect(isMp4Brand(Buffer.alloc(8))).toBe(false);
    });
});

describe('fitInside', () => {
    it('never enlarges a frame that already fits', () => {
        expect(fitInside(640, 360, 1920)).toEqual({ width: 640, height: 360 });
    });

    it('scales the longest edge down to the cap, either orientation', () => {
        expect(fitInside(3840, 2160, 1920)).toEqual({ width: 1920, height: 1080 });
        expect(fitInside(2160, 3840, 1920)).toEqual({ width: 1080, height: 1920 });
    });

    it('always returns even edges — libx264 with yuv420p fails on an odd one', () => {
        // A real source with an odd coded height, already inside the cap.
        expect(fitInside(1080, 607, 1920)).toEqual({ width: 1080, height: 606 });
        const scaled = fitInside(1999, 1333, 1000);
        expect(scaled.width % 2).toBe(0);
        expect(scaled.height % 2).toBe(0);
    });

    it('never collapses to zero', () => {
        expect(fitInside(1, 1, 1920)).toEqual({ width: 2, height: 2 });
    });
});

describe('parseFrameRate', () => {
    it('resolves ffprobe rationals', () => {
        expect(parseFrameRate('30/1')).toBe(30);
        expect(parseFrameRate('30000/1001')).toBeCloseTo(29.97, 2);
    });

    it('returns null for the unusable values so the caller can fall back', () => {
        expect(parseFrameRate('0/0')).toBeNull();
        expect(parseFrameRate('0/1')).toBeNull();
        expect(parseFrameRate(undefined)).toBeNull();
        expect(parseFrameRate('')).toBeNull();
    });
});
