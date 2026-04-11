import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api-exception';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';

export class MediaModerationException extends ApiException {
  constructor(reason?: string) {
    super(
      API_ERRORS.CONTENT_MODERATION_NOT_ALLOWED,
      reason || 'Content not allowed by moderation policy',
      HttpStatus.FORBIDDEN,
    );
  }
}

