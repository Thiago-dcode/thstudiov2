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

}
