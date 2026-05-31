import { Injectable, NotFoundException } from '@nestjs/common';
import { UserContactsRepository } from './user-contacts.repository';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CREATE_OR_UPDATE_EMAIL_PREFERENCE,
  CREATE_USER_CONTACT,
} from '@repo/common-lib/constants/constants';
import { CreateUserContactEvent } from './events/create-user-contact.event';
import { CreateOrUpdateEmailPreferenceEvent } from '../email-preferences/events/create-or-update-email-preference.event';

@Injectable()
export class UserContactsService {
  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateUserContactRequest) {
    // Priority: enqueue email preference upsert immediately
    this.eventEmitter.emit(
      CREATE_OR_UPDATE_EMAIL_PREFERENCE,
      new CreateOrUpdateEmailPreferenceEvent({
        email: data.contact_email,
        user_id: data.user_id,
      }),
    );

    this.eventEmitter.emit(
      CREATE_USER_CONTACT,
      new CreateUserContactEvent(data),
    );
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
