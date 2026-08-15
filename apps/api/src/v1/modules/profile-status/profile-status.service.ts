import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CACHE_KEY_PROFILE_STATUS,
  UPDATE_PROFILE_STATUS_EVENT,
} from '@repo/common-lib/constants/constants';
import type {
  CreateProfileStatusInput,
  ProfileStatus,
  UpdateProfileStatusInput,
} from '@repo/common-lib/types/profile-status';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateProfileStatusEvent } from './events/update-profile-status.event';
import { ProfileStatusRepository } from './profile-status.repository';

@Injectable()
export class ProfileStatusService {
  constructor(
    private readonly profileStatusRepository: ProfileStatusRepository,
    private readonly helpers: Helpers,
  ) {}

  async findOneByUserId(userId: number): Promise<ProfileStatus> {
    return this.helpers.cacheRemember(
      CACHE_KEY_PROFILE_STATUS(userId),
      async () => {
        const existing = await this.profileStatusRepository.findByUserId(userId);
        if (existing) return existing;
        return this.create({ user_id: userId });
      },
      { append_language: false, ttl: 1000 * 60 * 60 * 24 },
    );
  }

  async create(data: CreateProfileStatusInput): Promise<ProfileStatus> {
    try {
      return await this.profileStatusRepository.create(data);
    } catch (error) {
      if (error instanceof DbUniqueViolationException) {
        const existing = await this.profileStatusRepository.findByUserId(
          data.user_id,
        );
        if (existing) return existing;
      }
      throw error;
    }
  }

  async update(
    userId: number,
    data: UpdateProfileStatusInput,
  ): Promise<ProfileStatus> {
    const result = await this.profileStatusRepository.updateByUserId(
      userId,
      data,
    );
    await this.helpers.deleteCached(CACHE_KEY_PROFILE_STATUS(userId));
    return result;
  }

  @OnEvent(UPDATE_PROFILE_STATUS_EVENT)
  async handleUpdate(event: UpdateProfileStatusEvent): Promise<void> {
    const patch: UpdateProfileStatusInput = {};
    for (const [key, value] of Object.entries(event.fields)) {
      if (typeof value === 'boolean') {
        patch[key as keyof UpdateProfileStatusInput] = value;
      }
    }
    if (!Object.keys(patch).length) return;
    await this.findOneByUserId(event.userId);
    await this.update(event.userId, patch);
  }

  /** Idempotent sync of all users' flags from live related data. */
  async backfillAll(): Promise<number> {
    return this.profileStatusRepository.backfillAllFromLiveData();
  }
}
