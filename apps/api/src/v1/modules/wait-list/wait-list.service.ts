import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  CREATE_WAIT_LIST_ENTRY,
  INVITE_WAIT_LIST_BATCH,
  CREATE_OR_UPDATE_EMAIL_PREFERENCE,
  DEFAULT_LANGUAGE,
} from '@repo/common-lib/constants/constants';
import type {
  PublicCreateWaitListInput,
  WaitListCreateResponse,
  UpdateWaitListInput,
} from '@repo/common-lib/types/wait-list';
import { RequestService } from 'src/common/services/request.service';
import { CreateWaitListEvent } from './events/create-wait-list.event';
import { InviteWaitListBatchEvent } from './events/invite-wait-list-batch.event';
import { IndexWaitListRequest } from './requests/index-wait-list.request';
import { WaitListRepository } from './wait-list.repository';
import { CreateOrUpdateEmailPreferenceEvent } from '../email-preferences/events/create-or-update-email-preference.event';

@Injectable()
export class WaitListService {
  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LogService,
    private readonly requestService: RequestService,
  ) { }

  async findAll(filters: IndexWaitListRequest) {
    return this.waitListRepository.getAll(filters);
  }

  async findByInvitationLinkId(invitationLinkId: number) {
    return this.waitListRepository.findByInvitationLinkId(invitationLinkId);
  }

  async findByEmail(email: string) {
    return this.waitListRepository.findByEmail(email);
  }

  async getEmailByInvitationCode(code: string): Promise<{ email: string } | null> {
    try {
      const email = await this.waitListRepository.findEmailByInvitationCode(code);
      if (!email) {
        this.logger.info(`No email found for invitation code: ${code.slice(0, 4)}***`);
        return null;
      }

      this.logger.info(`Email resolved for invitation code: ${code.slice(0, 4)}***`, {
        email: this.redactEmail(email),
      });
      return { email };
    } catch (error) {
      this.logger.error(
        `Failed to resolve email by invitation code - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  async updateById(id: number, data: UpdateWaitListInput) {
    return this.waitListRepository.updateById(id, data);
  }

  async validate(token: string) {
    try {
      const waitList = await this.waitListRepository.findByToken(token);

      if (!waitList) {
        this.logger.warn('Invalid or expired wait list token');
        throw new NotFoundException('Invalid or expired token');
      }

      if (waitList.validated_at) {
        this.logger.info(`Wait list token already validated: entry ${waitList.id}`);
        return waitList;
      }

      const validatedCount = await this.waitListRepository.getValidatedCount();
      const position = waitList.position ?? validatedCount + 1;

      const updated = await this.waitListRepository.updateByToken(token, {
        validated_at: new Date(),
        position,
      });

      this.logger.info(`Wait list entry validated: entry ${updated.id}, position ${position}`, {
        entry_id: updated.id,
        position,
      });

      return updated;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to validate wait list token - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      }
      throw error;
    }
  }

  async create({ email }: PublicCreateWaitListInput): Promise<WaitListCreateResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    const emailLog = this.redactEmail(normalizedEmail);
    const language = this.requestService.language ?? DEFAULT_LANGUAGE;

    try {
      const existing = await this.waitListRepository.findByEmail(normalizedEmail);
      if (existing && existing.validated_at) {
        this.logger.info(`Wait list entry already validated: ${emailLog}`, { entry_id: existing.id });
        return {
          email: existing.email,
          message: 'You are already on the wait list',
          already_exists: true,
        };
      }

      this.logger.info(`Emitting wait list create events: ${emailLog}`, { language });

      this.eventEmitter.emit(
        CREATE_OR_UPDATE_EMAIL_PREFERENCE,
        new CreateOrUpdateEmailPreferenceEvent({
          email: normalizedEmail,
        }),
      );

      this.eventEmitter.emit(
        CREATE_WAIT_LIST_ENTRY,
        new CreateWaitListEvent({ email: normalizedEmail, language }),
      );

      return {
        email: normalizedEmail,
        message: 'You have been added to the wait list',
      } satisfies WaitListCreateResponse;
    } catch (error) {
      this.logger.error(
        `Failed to create wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  async inviteBatch(count: number) {
    try {
      console.log('EMITING')
      if (!Number.isFinite(count) || count <= 0) {
        this.logger.warn(`Invalid wait list batch invite count: ${count}`);
      }

      this.logger.info(`Emitting wait list batch invite event: count=${count}`);

      this.eventEmitter.emit(
        INVITE_WAIT_LIST_BATCH,
        new InviteWaitListBatchEvent(count),
      );

      return {
        count,
        message: 'Wait list batch invitations have been queued',
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue wait list batch invite - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private redactEmail(email: string) {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return '[redacted]';
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }
}
