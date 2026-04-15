import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { UserStorageRequestSchemaColumns } from '@repo/common-lib/schemas/user-storage-request';
import { CreateUserStorageRequestInput, UserStorageRequest } from '@repo/common-lib/types/user-storage-request';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class UserStorageRequestRepository extends BaseRepository {
  private readonly COLUMNS: UserStorageRequestSchemaColumns[] = [
    'user_storage_requests.id',
    'user_storage_requests.path',
    'user_storage_requests.bytes',
    'user_storage_requests.user_id',
  ] as const;

  constructor(protected readonly logService: LogService) {
    super('user_storage_requests', logService);
  }

  async create(data: CreateUserStorageRequestInput) {
    return await super._create<UserStorageRequest>(data, {
      select: this.COLUMNS,
    });
  }

  async getAllTodaysUserRequests(userId: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .where('created_at', '>=', startOfDay(new Date()))
      .where('created_at', '<=', endOfDay(new Date()))
      .get<UserStorageRequest[]>();
  }
}
