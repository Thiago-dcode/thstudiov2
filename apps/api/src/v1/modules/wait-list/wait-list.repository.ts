import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EnumType } from '@repo/common-lib/constants/enums';
import { WaitListSchema, WaitListSchemaColumns } from '@repo/common-lib/schemas/wait-list';
import { CreateWaitListInput, UpdateWaitListInput, WaitList } from '@repo/common-lib/types/wait-list';
import { DbException } from '@repo/database/exceptions';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import { IndexWaitListRequest } from './requests/index-wait-list.request';

type MaxPositionRow = {
  max_position: number | string | null;
};

export type WaitListInvitationBatchRow = WaitList & {
  invitation_code: string;
  benefit_type: EnumType<'BENEFIT_TYPE'>;
  trial_days: number;
};

@Injectable()
export class WaitListRepository extends BaseRepository {
  private readonly COLUMNS: WaitListSchemaColumns[] = [
    'wait_list.id',
    'wait_list.email',
    'wait_list.position',
    'wait_list.status',
    'wait_list.redeemed_at',
    'wait_list.invitation_link_id',
  ] as const;

  constructor(
    private readonly requestService: RequestService,
    protected readonly logService: LogService,
  ) {
    super('wait_list', logService);
  }

  async getAll(filters: IndexWaitListRequest): Promise<WaitList[]> {
    const query = this.query().select(this.COLUMNS);

    if (filters.status) {
      query.where('status', '=', filters.status);
    }

    query.orderBy('position', 'ASC');

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);

    const results = await query.get<WaitListSchema[]>();
    return results.map((result) => this.format(result));
  }

  async getMaxPosition(): Promise<number> {
    const result = await this.query()
      .rawSelect('COALESCE(MAX(position), 0) as max_position')
      .first<MaxPositionRow>();

    return Number(result?.max_position ?? 0);
  }

  async getWaitingBatch(limit: number): Promise<WaitListInvitationBatchRow[]> {
    const results = await this.query()
      .select([
        ...this.COLUMNS,
        'invitation_links.code as invitation_code',
        'benefits.type as benefit_type',
        'benefits.trial_days',
      ])
      .join('invitation_link_id', 'invitation_links', 'id', 'INNER')
      .join('invitation_links.benefit_id', 'benefits', 'id', 'INNER')
      .where('wait_list.status', '=', 'WAITING')
      .orderBy('wait_list.position', 'ASC')
      .limit(limit)
      .get<(WaitListSchema & {
        invitation_code: string;
        benefit_type: EnumType<'BENEFIT_TYPE'>;
        trial_days: number;
      })[]>();

    return results.map((result) => ({
      ...this.format(result),
      invitation_code: result.invitation_code,
      benefit_type: result.benefit_type,
      trial_days: result.trial_days,
    }));
  }

  async updateById(id: number, data: UpdateWaitListInput): Promise<WaitList> {
    const cols = Object.keys(data);
    const values = Object.values(data);

    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<WaitListSchema>();

    if (!result) {
      throw new DbException('Could not update wait list entry');
    }

    return this.format(result);
  }

  async create(data: CreateWaitListInput): Promise<WaitList> {
    const cols = Object.keys(data);
    const values = Object.values(data);

    const result = await this.query()
      .insertAndGet<WaitListSchema>(cols, values, this.COLUMNS);

    if (!result) {
      throw new DbException('Could not create wait list entry');
    }

    return this.format(result);
  }

  private format(result: WaitListSchema): WaitList {
    return {
      id: result.id,
      email: result.email,
      position: result.position,
      status: result.status,
      redeemed_at: result.redeemed_at,
      invitation_link_id: result.invitation_link_id,
    };
  }
}
