import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
} from '../../constants/limits';
import { MediaHelper } from '../media';

const file = (type: string, size: number): Pick<File, 'type' | 'size'> => ({
  type,
  size,
});

describe('MediaHelper.getMediaTypeFromMimeType', () => {
  it('maps still-image mime types to IMAGE', () => {
    expect(MediaHelper.getMediaTypeFromMimeType('image/jpeg')).toBe('IMAGE');
    expect(MediaHelper.getMediaTypeFromMimeType('image/png')).toBe('IMAGE');
    expect(MediaHelper.getMediaTypeFromMimeType('image/webp')).toBe('IMAGE');
  });

  it('maps image/gif to GIF, not IMAGE', () => {
    expect(MediaHelper.getMediaTypeFromMimeType('image/gif')).toBe('GIF');
  });

  it('maps video mime types to VIDEO', () => {
    expect(MediaHelper.getMediaTypeFromMimeType('video/mp4')).toBe('VIDEO');
    expect(MediaHelper.getMediaTypeFromMimeType('video/quicktime')).toBe('VIDEO');
    expect(MediaHelper.getMediaTypeFromMimeType('video/mpeg')).toBe('VIDEO');
  });

  it('normalizes mime type case', () => {
    expect(MediaHelper.getMediaTypeFromMimeType('IMAGE/JPEG')).toBe('IMAGE');
    expect(MediaHelper.getMediaTypeFromMimeType('Image/GIF')).toBe('GIF');
    expect(MediaHelper.getMediaTypeFromMimeType('VIDEO/MP4')).toBe('VIDEO');
  });

  it('returns null for non-media mime types', () => {
    expect(MediaHelper.getMediaTypeFromMimeType('application/pdf')).toBeNull();
    expect(MediaHelper.getMediaTypeFromMimeType('audio/mpeg')).toBeNull();
    expect(MediaHelper.getMediaTypeFromMimeType('')).toBeNull();
  });
});

describe('MediaHelper.allowedFileSize', () => {
  it('allows images at the image byte cap', () => {
    expect(
      MediaHelper.allowedFileSize(file('image/jpeg', MAX_IMAGE_UPLOAD_BYTES)),
    ).toBe(true);
    expect(
      MediaHelper.allowedFileSize(file('image/png', MAX_IMAGE_UPLOAD_BYTES)),
    ).toBe(true);
  });

  it('rejects images over the image byte cap', () => {
    expect(
      MediaHelper.allowedFileSize(file('image/jpeg', MAX_IMAGE_UPLOAD_BYTES + 1)),
    ).toBe(false);
  });

  it('uses the image cap for gifs, not the video cap', () => {
    expect(
      MediaHelper.allowedFileSize(file('image/gif', MAX_IMAGE_UPLOAD_BYTES)),
    ).toBe(true);
    expect(
      MediaHelper.allowedFileSize(file('image/gif', MAX_IMAGE_UPLOAD_BYTES + 1)),
    ).toBe(false);
  });

  it('allows videos at the video byte cap', () => {
    expect(
      MediaHelper.allowedFileSize(file('video/mp4', MAX_VIDEO_UPLOAD_BYTES)),
    ).toBe(true);
  });

  it('rejects videos over the video byte cap', () => {
    expect(
      MediaHelper.allowedFileSize(file('video/mp4', MAX_VIDEO_UPLOAD_BYTES + 1)),
    ).toBe(false);
  });

  it('does not apply the video cap to images', () => {
    expect(
      MediaHelper.allowedFileSize(file('image/webp', MAX_IMAGE_UPLOAD_BYTES + 1)),
    ).toBe(false);
  });

  it('normalizes mime type case when checking size', () => {
    expect(
      MediaHelper.allowedFileSize(file('IMAGE/JPEG', MAX_IMAGE_UPLOAD_BYTES)),
    ).toBe(true);
    expect(
      MediaHelper.allowedFileSize(file('VIDEO/MP4', MAX_VIDEO_UPLOAD_BYTES)),
    ).toBe(true);
  });

  it('rejects unknown mime types regardless of size', () => {
    expect(MediaHelper.allowedFileSize(file('application/pdf', 1))).toBe(false);
    expect(MediaHelper.allowedFileSize(file('', 1))).toBe(false);
  });
});

describe('MediaHelper.outputExtension', () => {
  it('keeps GIFs as gif and maps still images to webp', () => {
    expect(MediaHelper.outputExtension('GIF')).toBe('gif');
    expect(MediaHelper.outputExtension('IMAGE')).toBe('webp');
    expect(MediaHelper.outputExtension('VIDEO')).toBe('webp');
    expect(MediaHelper.outputExtension(null)).toBe('webp');
    expect(MediaHelper.outputExtension(undefined)).toBe('webp');
  });
});

describe('MediaHelper.storageFilename', () => {
  it('slugifies names that would break a bare CDN URL', () => {
    expect(MediaHelper.storageFilename('giphy (1)', 'fallback')).toBe('giphy-1');
    expect(MediaHelper.storageFilename('my photo', 'fallback')).toBe('my-photo');
    expect(MediaHelper.storageFilename('report#1?v=2', 'fallback')).toBe('report-1-v-2');
  });

  it('folds accents to ascii instead of dropping the letter', () => {
    expect(MediaHelper.storageFilename('café', 'fallback')).toBe('cafe');
    expect(MediaHelper.storageFilename('São Paulo', 'fallback')).toBe('sao-paulo');
  });

  it('collapses repeats and trims leading/trailing separators', () => {
    expect(MediaHelper.storageFilename('  --a   b--  ', 'fallback')).toBe('a-b');
  });

  it('falls back when nothing usable survives', () => {
    expect(MediaHelper.storageFilename('🙂🙂', 'fallback')).toBe('fallback');
    expect(MediaHelper.storageFilename('...', 'fallback')).toBe('fallback');
    expect(MediaHelper.storageFilename('', 'fallback')).toBe('fallback');
  });

  it('truncates long names without leaving a trailing separator', () => {
    const result = MediaHelper.storageFilename(`${'a'.repeat(99)} tail`, 'fallback');
    expect(result).toBe('a'.repeat(99));
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('cannot escape its path segment', () => {
    expect(MediaHelper.storageFilename('../../etc/passwd', 'fallback')).toBe('etc-passwd');
  });
});

describe('MediaHelper.withExtension', () => {
  it('replaces a trailing extension without touching directories', () => {
    expect(
      MediaHelper.withExtension('users/abc/media/id/photo.webp', 'gif'),
    ).toBe('users/abc/media/id/photo.gif');
  });

  it('appends when the path has no extension', () => {
    expect(MediaHelper.withExtension('users/abc/media/id/photo', 'gif')).toBe(
      'users/abc/media/id/photo.gif',
    );
  });
});

describe('MediaHelper.thumbnailPath', () => {
  it('inserts -thumbnail before the extension', () => {
    expect(MediaHelper.thumbnailPath('users/abc/media/id/photo.webp')).toBe(
      'users/abc/media/id/photo-thumbnail.webp',
    );
  });

  it('is always webp, even for a gif media', () => {
    expect(MediaHelper.thumbnailPath('users/abc/media/id/photo.gif')).toBe(
      'users/abc/media/id/photo-thumbnail.webp',
    );
  });

  it('appends when the media path has no extension', () => {
    expect(MediaHelper.thumbnailPath('users/abc/media/id/photo')).toBe(
      'users/abc/media/id/photo-thumbnail.webp',
    );
  });
});
