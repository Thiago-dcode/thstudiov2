import { Injectable } from '@nestjs/common';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { OnEvent } from '@nestjs/event-emitter';
import { UPDATE_USER_EXTRA_DATA_METRICS } from '@repo/common-lib/constants/constants';
import { UpdateUserExtraDataMetricsEvent } from './events/update-user-extra-data-metrics.event';
import { Query } from '@repo/database/facades';
import { Media } from '@repo/common-lib/types/media';

@Injectable()
export class UserExtraDataService {
  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
  ) {}
  create() {
    return 'This action adds a new userExtraDatum';
  }

  findAll() {
    return `This action returns all userExtraData`;
  }

  async findOneByUserId(userId: number) {
    return await this.userExtraDataRepository.findByUserId(userId);
  }

  @OnEvent(UPDATE_USER_EXTRA_DATA_METRICS)
  async handleUpdateUserExtraData(data: UpdateUserExtraDataMetricsEvent) {
    const media = await Query.table('media')
      .select(['id', 'bytes'])
      .where('blocked', '=', false)
      .where('user_id', '=', data.userId)
      .get<Pick<Media, 'id' | 'bytes'>[]>();

      
    const totalBytes = media.reduce((prev, curr) => prev + curr.bytes, 0);
    const media_size =
      totalBytes > 0 ? Math.round(totalBytes / (1024 * 1024)) : 0;
    const media_count = media.length;
    const projects_count = await Query.table('projects')
      .softDeletes(true)
      .where('user_id', '=', data.userId)
      .count();
    const portfolios_count = await Query.table('portfolios')
      .softDeletes(true)
      .where('user_id', '=', data.userId)
      .count();
    const services_count = await Query.table('services')
      .softDeletes(true)
      .where('user_id', '=', data.userId)
      .count();
    const clients_count = await Query.table('clients')
      .softDeletes(true)
      .where('user_id', '=', data.userId)
      .count();
    await this.userExtraDataRepository.updateByUserId(data.userId, {
      media_size,
      media_count,
      portfolios_count,
      projects_count,
      services_count,
      clients_count,
    });
  }
}
