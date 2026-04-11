import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';

export class MediaModerationEvent {
  constructor(
    public readonly moderation: CreateMediaModerationInput,
  ) {}
}

