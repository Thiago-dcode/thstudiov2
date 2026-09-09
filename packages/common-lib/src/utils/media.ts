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

  /**
   * Upload ceiling for a mime type, in bytes. `0` for anything that is not media at all, so a
   * size check against it always fails.
   *
   * Video is allowed to be an order of magnitude larger than an image — a raw phone clip runs
   * 10-20 Mbps, and the worker transcodes it down to a delivery bitrate afterwards.
   */
  static maxUploadBytes(mimeType: string): number {
    const mediaType = MediaHelper.getMediaTypeFromMimeType(mimeType);

    if (mediaType === 'VIDEO') return MAX_VIDEO_UPLOAD_BYTES;
    if (mediaType === 'IMAGE' || mediaType === 'GIF') return MAX_IMAGE_UPLOAD_BYTES;

    return 0;
  }

  static allowedFileSize(file: Pick<File, 'type' | 'size'>): boolean {
    const limit = MediaHelper.maxUploadBytes(file.type);
    return limit > 0 && file.size <= limit;
  }

  /**
   * Stored object extension after processing. GIFs stay GIF, videos become MP4, everything
   * else is WebP.
   */
  static outputExtension(
    mediaType: EnumType<'MEDIA_TYPE'> | null | undefined,
  ): 'gif' | 'webp' | 'mp4' {
    if (mediaType === 'GIF') return 'gif';
    if (mediaType === 'VIDEO') return 'mp4';
    return 'webp';
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
   * Key for the untouched upload, parked beside the eventual output.
   *
   * The async flow writes the original before the worker has processed anything, and the
   * output key's extension is decided by the media TYPE, not by what was uploaded. For an
   * image that mismatch is harmless — a JPEG briefly sits under a `.webp` key that the worker
   * overwrites seconds later. For video it is not: an uploaded `.mov` under a `.mp4` key is
   * served as `video/mp4` (S3 ContentType is derived from the key), and the transcode output
   * needs somewhere else to land so the two never race.
   *
   * `.source.` is unambiguous as a marker because {@link storageFilename} strips every
   * non-alphanumeric character, so a slug can never itself contain a dot.
   */
  static sourcePath(mediaPath: string, sourceExtension: string): string {
    const base = mediaPath.replace(/\.[^./\\]+$/, '');
    return `${base}.source.${sourceExtension.replace(/^\./, '').toLowerCase()}`;
  }

  /**
   * Inverse of {@link sourcePath}: the processed key for a stored source. A no-op round trip
   * for media whose source and output share a key, so callers need no media-type branch.
   */
  static outputPath(sourcePath: string, outputExtension: string): string {
    const base = sourcePath.replace(/(?:\.source)?\.[^./\\]+$/, '');
    return `${base}.${outputExtension}`;
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

  /**
   * `{base}.{anything}` → `{base}-preview-{index}.webp`, the key for one of the frames sampled
   * across a video.
   *
   * These are what moderation judges, so they exist for every video even though only the first
   * doubles as the thumbnail. Deliberately NOT reusing {@link thumbnailPath} for index 0: the
   * two names would then be interchangeable and a later change to either would silently
   * repoint the other.
   */
  static previewScreenshotPath(mediaUrl: string, index: number): string {
    const base = mediaUrl.replace(/\.[^./\\]+$/, '');
    return `${base}-preview-${index}.webp`;
  }

  /**
   * `{base}.{anything}` → `{base}-preview.mp4`, the key for a video's short playable clip.
   *
   * Only used when the source is longer than the preview window; a video already shorter than
   * that is its own preview and keeps pointing at its own key instead.
   */
  static videoPreviewPath(mediaUrl: string): string {
    const base = mediaUrl.replace(/\.[^./\\]+$/, '');
    return `${base}-preview.mp4`;
  }

  /**
   * Bytes a media row actually occupies in storage — the number every quota and every billing
   * decision has to be made against.
   *
   * Not `bytes + thumbnail_bytes`: a video also stores the frames sampled for moderation and,
   * when it runs long enough to need one, a preview clip. What makes this worth a function is
   * that those assets deliberately ALIAS each other, so the naive sum over-counts:
   *
   *   - `thumbnail` IS `previews[0]`, one object under one key, so its bytes are already inside
   *     `previews_bytes` — which is why this takes one or the other and never both.
   *   - an aliased `video_preview` (the media being its own preview) has no bytes of its own,
   *     which is exactly why the worker leaves `video_preview_bytes` null in that case rather
   *     than repeating `bytes` there.
   *
   * Keep {@link MediaHelper.storageBytesSql} in step with this.
   */
  static storageBytes(
    media: Pick<
      Media,
      'bytes' | 'thumbnail_bytes' | 'previews_bytes' | 'video_preview_bytes'
    >,
  ): number {
    return (
      media.bytes +
      (media.previews_bytes ?? media.thumbnail_bytes) +
      (media.video_preview_bytes ?? 0)
    );
  }

  /** {@link MediaHelper.storageBytes} as SQL, for aggregates that cannot pull whole rows. */
  static readonly storageBytesSql =
    'media.bytes + COALESCE(media.previews_bytes, media.thumbnail_bytes) + COALESCE(media.video_preview_bytes, 0)';

}
