import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';

@Injectable()
export class UserNotificationsRepository extends BaseRepository {
  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.USER_NOTIFICATIONS, logService);
  }

  async create(data: { notification_type: string; user_id: number; payload: any }) {
    return await super._create(data);
  }
}

