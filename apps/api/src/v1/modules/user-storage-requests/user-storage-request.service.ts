import { Injectable } from '@nestjs/common';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import {
  UserStorageRequest,
} from '@repo/common-lib/types/user-storage-request';

@Injectable()
export class UserStorageRequestService {
  constructor(
    private readonly userStorageRequestRepository: UserStorageRequestRepository,
  ) {}

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
