import { Injectable, NotFoundException } from '@nestjs/common';
import { UserContactsRepository } from './user-contacts.repository';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';
import { IndexUserContactRequest } from './requests/index-user-contact.request';
import { QueueHelper } from '@repo/backend-lib/utils';
import { RequestService } from 'src/common/services/request.service';
import type { ApiLogger } from 'src/common/services/request.service';

@Injectable()
export class UserContactsService {
  private readonly logger: ApiLogger;

  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    private readonly requestService: RequestService,
  ) {
    this.logger = this.requestService.log('user-contacts');
  }

  async create(data: CreateUserContactRequest) {
    this.logger.info("Creating new contact",data);
    // The sender's email gets a preference row (so they can opt out), never bound to an account:
    // `data.user_id` is the contacted artist, not the owner of `contact_email`.
    await QueueHelper.createOrUpdateEmailPreferenceJob({
      email: data.contact_email,
    }, this.requestService.traceCarrier());

    await QueueHelper.createUserContactJob(data, this.requestService.traceCarrier());
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    };
  }

  async findAll(userId: number, filters: IndexUserContactRequest) {
    return await this.userContactsRepository.findAll(userId, filters);
  }

  async findOne(id: number, userId: number) {
    const contact = await this.userContactsRepository.findOne(id);
    if (!contact || contact.user_id !== userId) {
      throw new NotFoundException(`User contact with ID ${id} not found`);
    }
    return contact;
  }

  async update(id: number, userId: number, data: UpdateUserContactRequest) {
    await this.findOne(id, userId);
    return await this.userContactsRepository.updateOne(id, data);
  }
}
