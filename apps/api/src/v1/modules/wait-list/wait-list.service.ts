import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CREATE_WAIT_LIST_ENTRY,
  INVITE_WAIT_LIST_BATCH,
  CREATE_OR_UPDATE_EMAIL_PREFERENCE,
} from '@repo/common-lib/constants/constants';
import type {
  PublicCreateWaitListInput,
  WaitListCreateResponse,
  UpdateWaitListInput,
  WaitListPosition,
} from '@repo/common-lib/types/wait-list';
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
  ) { }

  async findAll(filters: IndexWaitListRequest) {
    return this.waitListRepository.getAll(filters);
  }

  async findByInvitationLinkId(invitationLinkId: number) {
    return this.waitListRepository.findByInvitationLinkId(invitationLinkId);
  }

  async updateById(id: number, data: UpdateWaitListInput) {
    return this.waitListRepository.updateById(id, data);
  }

  async getCurrentPosition(): Promise<WaitListPosition> {
    const validatedCount = await this.waitListRepository.getValidatedCount();

    return {
      position: validatedCount + 1,
    };
  }

  async validate(token: string) {
    const waitList = await this.waitListRepository.findByToken(token);

    if (!waitList) {
      throw new NotFoundException('Invalid or expired token');
    }

    if (waitList.validated_at) {
      return waitList;
    }

    const validatedCount = await this.waitListRepository.getValidatedCount();

    return this.waitListRepository.updateByToken(token, {
      validated_at: new Date(),
      position: waitList.position ?? validatedCount + 1,
    });
  }

  async create({ email }: PublicCreateWaitListInput): Promise<WaitListCreateResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.waitListRepository.findByEmail(normalizedEmail);
    if (existing) {
      return {
        email: existing.email,
        message: 'You are already on the wait list',
        already_exists: true,
      };
    }

    // Priority: enqueue email preference upsert immediately
    this.eventEmitter.emit(
      CREATE_OR_UPDATE_EMAIL_PREFERENCE,
      new CreateOrUpdateEmailPreferenceEvent({
        email: normalizedEmail,
      }),
    );

    this.eventEmitter.emit(
      CREATE_WAIT_LIST_ENTRY,
      new CreateWaitListEvent({ email: normalizedEmail }),
    );

    return {
      email: normalizedEmail,
      message: 'You have been added to the wait list',
    } satisfies WaitListCreateResponse;
  }

  async inviteBatch(count: number) {
    this.eventEmitter.emit(
      INVITE_WAIT_LIST_BATCH,
      new InviteWaitListBatchEvent(count),
    );

    return {
      count,
      message: 'Wait list batch invitations have been queued',
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
