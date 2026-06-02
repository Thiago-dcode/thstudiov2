import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { Query } from '@repo/database/facades';
import { WaitListSchema, WaitListSchemaColumns } from '@repo/common-lib/schemas/wait-list';
import { CreateWaitListInput, UpdateWaitListInput, WaitList } from '@repo/common-lib/types/wait-list';
import { DbException } from '@repo/database/exceptions';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import { IndexWaitListRequest } from './requests/index-wait-list.request';

type MaxPositionRow = {
  max_position: number | string | null;
};

@Injectable()
export class WaitListRepository extends BaseRepository {
  private readonly COLUMNS: WaitListSchemaColumns[] = [
    'wait_list.id',
    'wait_list.email',
    'wait_list.token',
    'wait_list.position',
    'wait_list.status',
    'wait_list.redeemed_at',
    'wait_list.expires_at',
    'wait_list.validated_at',
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

  async getValidatedCount(): Promise<number> {
    return await this.query()
      .where('validated_at', 'IS NOT', null)
      .count();
  }

  async getWaitingBatch(limit: number): Promise<WaitList[]> {
    const results = await this.query()
      .select([
        ...this.COLUMNS,
      ])
      .where('wait_list.status', '=', 'WAITING')
      .where('wait_list.validated_at', 'IS NOT', null)
      .orderBy('wait_list.position', 'ASC')
      .limit(limit)
      .get<WaitListSchema[]>();

    return results.map((result) => this.format(result));
  }

  async claimWaitingBatch(limit: number): Promise<WaitList[]> {
    if (limit <= 0) {
      return [];
    }

    const result = await Query.raw(
      `WITH claimed AS (
        SELECT id
        FROM wait_list
        WHERE status = 'WAITING'
          AND validated_at IS NOT NULL
        ORDER BY position ASC NULLS LAST, id ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE wait_list
      SET status = 'INVITING'
      WHERE id IN (SELECT id FROM claimed)
      RETURNING id, email, token, position, status, redeemed_at, expires_at, validated_at, invitation_link_id;`,
      [limit],
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return rows.map((row: WaitListSchema) => this.format(row));
  }

  async findByToken(token: string): Promise<WaitList | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('token', '=', token)
      .first<WaitListSchema>();

    return result ? this.format(result) : null;
  }

  async findByEmail(email: string): Promise<WaitList | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('email', '=', normalizedEmail)
      .first<WaitListSchema>();

    return result ? this.format(result) : null;
  }

  async findByInvitationLinkId(invitationLinkId: number): Promise<WaitList | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('invitation_link_id', '=', invitationLinkId)
      .first<WaitListSchema>();

    return result ? this.format(result) : null;
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

  async updateByToken(token: string, data: UpdateWaitListInput): Promise<WaitList> {
    const row = await this.findByToken(token);

    if (!row) {
      throw new DbException('Could not find wait list entry');
    }

    return this.updateById(row.id, data);
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
      token: result.token,
      position: result.position,
      status: result.status,
      redeemed_at: result.redeemed_at,
      expires_at: result.expires_at,
      validated_at: result.validated_at,
      invitation_link_id: result.invitation_link_id,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
