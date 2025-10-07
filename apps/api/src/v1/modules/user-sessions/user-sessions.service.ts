import { Injectable } from '@nestjs/common';
import { UserSessionsRepository } from './user-sessions.repository';
import {
  CreateUserSessionInput,
  UpdateUserSessionInput,
} from '@repo/database/schemas/user-sessions';
import { BaseUserSession, UserSession } from './user-sessions.types';

@Injectable()
export class UserSessionsService {
  constructor(
    private readonly userSessionsRepository: UserSessionsRepository,
  ) {}

  async findOneBySession(session: {
    user_id: number;
    user_auth_device_id?: number;
    token?: string;
  }): Promise<UserSession | null> {
    return await this.userSessionsRepository.findOneBySession(session);
  }
  async handleSessionProcess({
    user_id,
    user_auth_device_id,
    expires_at,
    token,
  }: Omit<BaseUserSession, 'id'>) {
    let session = await this.findOneBySession({
      user_id,
      user_auth_device_id,
    });

    if (!session) {
      session = await this.create({
        user_id,
        user_auth_device_id,
        expires_at,
        token,
      });
    } else {
      session = await this.update(session.id, { expires_at, token });
    }
    return session;
  }
  async create(sessionInput: CreateUserSessionInput) {
    return await this.userSessionsRepository.create(sessionInput);
  }

  async update(id: number, updateUserSessionInput: UpdateUserSessionInput) {
    return await this.userSessionsRepository.update(id, updateUserSessionInput);
  }
}
