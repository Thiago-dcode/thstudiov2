import { Injectable, NotFoundException } from '@nestjs/common';
import { UserContactsRepository } from './user-contacts.repository';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class UserContactsService {
  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    private readonly requestService: RequestService
  ) {}

  async create(data: CreateUserContactRequest) {
    const userId = this.requestService.user.id;
    return await this.userContactsRepository.create({
      ...data,
      user_id: userId,
    });
  }

  async findAll() {
    const userId = this.requestService.user.id;
    return await this.userContactsRepository.findAll(userId);
  }

  async findOne(id: number) {
    // const userId = this.requestService.user.id;
    const contact = await this.userContactsRepository.findOne(id);
    if (!contact) {
      throw new NotFoundException(`User contact with ID ${id} not found`);
    }
    return contact;
  }

  async update(id: number, data: UpdateUserContactRequest) {
    // const userId = this.requestService.user.id;
    return await this.userContactsRepository.updateOne(id, data);
  }
}
