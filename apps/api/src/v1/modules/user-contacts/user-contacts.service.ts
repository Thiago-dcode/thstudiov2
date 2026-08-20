import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserContactsRepository } from './user-contacts.repository';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';
import {
  EMAIL_PREFERENCES_QUEUE,
  USER_CONTACTS_QUEUE,
} from '@repo/common-lib/constants/constants';
import { QueueHelper } from '@repo/backend-lib/utils';
import { LogService } from '@repo/backend-lib/services/log-service';

@Injectable()
export class UserContactsService {
  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    @InjectQueue(EMAIL_PREFERENCES_QUEUE) private readonly emailPreferencesQueue: Queue,
    @InjectQueue(USER_CONTACTS_QUEUE) private readonly contactQueue: Queue,
    private readonly logger: LogService,
  ) {}

  async create(data: CreateUserContactRequest) {
    this.logger.info("Creating new contact",data);
    await QueueHelper.createOrUpdateEmailPreferenceJob(this.emailPreferencesQueue, {
      email: data.contact_email,
      user_id: data.user_id,
    });

    await QueueHelper.createUserContactJob(this.contactQueue, data);
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    };
  }

  async findAll(userId: number) {
    return await this.userContactsRepository.findAll(userId);
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
