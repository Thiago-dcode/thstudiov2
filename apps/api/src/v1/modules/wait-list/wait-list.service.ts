import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CREATE_WAIT_LIST_ENTRY,
  INVITE_WAIT_LIST_BATCH,
} from '@repo/common-lib/constants/constants';
import { PublicCreateWaitListInput } from '@repo/common-lib/types/wait-list';
import { CreateWaitListEvent } from './events/create-wait-list.event';
import { InviteWaitListBatchEvent } from './events/invite-wait-list-batch.event';
import { IndexWaitListRequest } from './requests/index-wait-list.request';
import { WaitListRepository } from './wait-list.repository';

@Injectable()
export class WaitListService {
  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(filters: IndexWaitListRequest) {
    return this.waitListRepository.getAll(filters);
  }

  async create({ email }: PublicCreateWaitListInput) {
    this.eventEmitter.emit(
      CREATE_WAIT_LIST_ENTRY,
      new CreateWaitListEvent({ email }),
    );

    return {
      email,
      message: 'You have been added to the wait list',
    };
  }

  async inviteBatch(count: number): Promise<void> {
    this.eventEmitter.emit(
      INVITE_WAIT_LIST_BATCH,
      new InviteWaitListBatchEvent(count),
    );
  }
}
