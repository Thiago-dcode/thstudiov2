import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UPDATE_PROFILE_STATUS_EVENT } from '@repo/common-lib/constants/events';
import { CACHE_KEY_PROFILE_STATUS } from '@repo/common-lib/constants/cache';
import { PROFILE_STATUS_FLAGS } from '@repo/common-lib/constants/profile-status';
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
  ) { }

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

  /** Close the setup guide for good. Only allowed once every step is done. */
  async close(userId: number): Promise<ProfileStatus> {
    const status = await this.findOneByUserId(userId);
    if (status.is_closed) return status;
    if (!PROFILE_STATUS_FLAGS.every((flag) => status[flag])) {
      throw new BadRequestException('Profile setup is not complete');
    }
    return this.update(userId, { is_closed: true });
  }

  async applyUpdate(
    userId: number,
    fields: UpdateProfileStatusInput,
  ): Promise<void> {
    const patch: UpdateProfileStatusInput = {};
    for (const flag of PROFILE_STATUS_FLAGS) {
      if (typeof fields[flag] === 'boolean') {
        patch[flag] = fields[flag];
      }
    }
    if (!Object.keys(patch).length) return;
    await this.findOneByUserId(userId);
    await this.update(userId, patch);
  }

  @OnEvent(UPDATE_PROFILE_STATUS_EVENT)
  async handleUpdate(event: UpdateProfileStatusEvent): Promise<void> {
    await this.applyUpdate(event.userId, event.fields);
  }

  /** Idempotent sync of all users' flags from live related data. */
  async backfillAll(): Promise<number> {
    return this.profileStatusRepository.backfillAllFromLiveData();
  }
}
