import { Injectable } from '@nestjs/common';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import {
  CreateUserStorageRequestInput,
  UserStorageRequest,
} from '@repo/common-lib/types/user-storage-request';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateUserStorageRequestEvent } from './events/create-user-storage-request.event';
import { CREATE_USER_STORAGE_REQUEST } from 'src/common/utils/constants';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';

@Injectable()
export class UserStorageRequestService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'user-storage-requests',
  });

  constructor(
    private readonly userStorageRequestRepository: UserStorageRequestRepository,
  ) {}

  async create(
    data: CreateUserStorageRequestInput,
  ): Promise<UserStorageRequest> {
    const storageRequest = await this.userStorageRequestRepository.create(data);
    this.logger.info(`Storage request created: ${data.path} (${data.bytes} bytes)`, {
      user_id: data.user_id,
      path: data.path,
      bytes: data.bytes,
    });
    return storageRequest;
  }

  @OnEvent(CREATE_USER_STORAGE_REQUEST)
  async handleCreateEvent(data: CreateUserStorageRequestEvent) {
    try {
      await this.create(data.storageRequest);
    } catch (error) {
      this.logger.error(
        `Failed to create storage request: ${data.storageRequest.path}`,
        error,
      );
    }
  }

  async getTodaysRequests(userId: number): Promise<UserStorageRequest[]> {
    return await this.userStorageRequestRepository.getAllTodaysUserRequests(
      userId,
    );
  }

  async getTodaysTotalBytes(userId: number): Promise<number> {
    const requests = await this.getTodaysRequests(userId);
    return requests.reduce((total, request) => total + request.bytes, 0);
  }

  async getTodaysRequestCount(userId: number): Promise<number> {
    const requests = await this.getTodaysRequests(userId);
    return requests.length;
  }
}
