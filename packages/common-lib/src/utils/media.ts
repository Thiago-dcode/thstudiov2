import { EnumType } from '../constants/enums';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES } from '../constants/limits';
import type { Media } from '../types/media';

export class MediaHelper {
  static isLoading(media: Pick<Media, 'status'> | null | undefined): boolean {
    if (!media) return false;
    return (
      media.status === 'UPLOADING' ||
      media.status === 'UPDATING' ||
      media.status === 'GENERATING_METADATA'
    );
  }

  static isCompleted(media: Media | null | undefined): boolean {
    if (!media) return false;
    return (media.status === 'COMPLETED' &&
      !!media.completed_at &&
      !media.blocked_at)
  }

  static getMediaTypeFromMimeType(mimeType: string): EnumType<'MEDIA_TYPE'> | null {
    const mime = mimeType.toLowerCase();

    if (mime === 'image/gif') {
      return 'GIF';
    }

    if (mime.startsWith('video/')) {
      return 'VIDEO';
    }

    if (mime.startsWith('image/')) {
      return 'IMAGE';
    }

    return null;
  }

  static allowedFileSize(file: Pick<File, 'type' | 'size'>): boolean {
    const mediaType = MediaHelper.getMediaTypeFromMimeType(file.type);

    if (mediaType === 'VIDEO') {
      return file.size <= MAX_VIDEO_UPLOAD_BYTES;
    }

    if (mediaType === 'IMAGE' || mediaType === 'GIF') {
      return file.size <= MAX_IMAGE_UPLOAD_BYTES;
    }

    return false;
  }

  /** Stored object extension after processing. GIFs stay GIF; everything else is WebP. */
  static outputExtension(mediaType: EnumType<'MEDIA_TYPE'> | null | undefined): 'gif' | 'webp' {
    return mediaType === 'GIF' ? 'gif' : 'webp';
  }

  /**
   * Slugify a filename so it is safe to embed in a storage key.
   *
   * Keys are served as bare CDN URLs (`${cdnUrl}/${path}`) and the segment used to come straight
   * from `file.originalname`. A perfectly ordinary download name — `giphy (1).gif`, `my photo.png`
   * — then produced a URL containing spaces and parentheses: tolerable in `<img src>` (the browser
   * percent-encodes it) but an invalid token inside a CSS `url(...)`, where it drops the whole
   * declaration and renders nothing. `#` and `?` truncate the URL outright.
   *
   * @param fallback used when the name slugifies to nothing (emoji, CJK, punctuation only).
   */
  static storageFilename(name: string, fallback: string): string {
    const slug = name
      // NFKD splits accented latin into base letter + combining mark; dropping the marks folds
      // `café` to `cafe` instead of losing the letter to the non-alphanumeric pass below.
      .normalize('NFKD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 100)
      .replace(/^-+|-+$/g, '');
    return slug || fallback;
  }

  /** Swap the trailing file extension, keeping directories intact. */
  static withExtension(path: string, extension: string): string {
    if (!/\.[^./\\]+$/.test(path)) {
      return `${path}.${extension}`;
    }
    return path.replace(/\.[^./\\]+$/, `.${extension}`);
  }

  /**
   * `{base}.{anything}` → `{base}-thumbnail.webp`.
   *
   * The thumbnail is always a static WebP poster frame, whatever the media's own format is.
   * A GIF thumbnail would otherwise be a second animated GIF: megabytes per grid tile, and
   * `next/image` freezes it to a first frame anyway. Keeping the two formats independent lets
   * listings render the cheap poster while only the pages that feature the media load the `.gif`.
   */
  static thumbnailPath(mediaUrl: string): string {
    const base = mediaUrl.replace(/\.[^./\\]+$/, '');
    return `${base}-thumbnail.webp`;
  }

}
