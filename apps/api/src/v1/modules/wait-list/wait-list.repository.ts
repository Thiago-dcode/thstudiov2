import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { Query } from '@repo/database/facades';
import { WaitListSchema, WaitListSchemaColumns } from '@repo/common-lib/schemas/wait-list';
import { CreateWaitListInput, UpdateWaitListInput, WaitList } from '@repo/common-lib/types/wait-list';
import { DbException } from '@repo/database/exceptions';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM, EnumType } from '@repo/common-lib/constants/enums';
import { RequestService } from 'src/common/services/request.service';
import { IndexWaitListRequest } from './requests/index-wait-list.request';

type MaxPositionRow = {
  max_position: number | string | null;
};

type InvitedDueForReminderRow = {
  id: number;
  email: string;
  position: number;
  expires_at: Date;
  welcome_email_sent_at: Date | null;
  reminder_count: number;
  last_reminder_email_sent_at: Date | null;
  invitation_code: string;
  benefit_type: EnumType<'BENEFIT_TYPE'>;
  trial_days: number;
  language: EnumType<'LANGUAGE_CODE'>;
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
    'wait_list.invitation_email_sent_at',
    'wait_list.welcome_email_sent_at',
    'wait_list.last_reminder_email_sent_at',
    'wait_list.reminder_count',
    'wait_list.language',
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
    // Count validated users that are still relevant for the waitlist.
    // - WAITING/INVITING always count
    // - INVITED only counts while their invite is not expired
    const waitListTable = TABLES_ENUM.WAIT_LIST;
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS validated_count
       FROM ${waitListTable} w
       WHERE w.validated_at IS NOT NULL
         AND (
           w.status IN ('WAITING', 'INVITING')
           OR (w.status = 'INVITED' AND w.expires_at > NOW())
         );`,
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Number(rows?.[0]?.validated_count ?? 0);
  }

  async expireInvitedExpiredRows(): Promise<number> {
    const waitListTable = TABLES_ENUM.WAIT_LIST;
    const result = await Query.raw(
      `UPDATE ${waitListTable}
       SET status = 'EXPIRED'
       WHERE status = 'INVITED'
         AND expires_at IS NOT NULL
         AND expires_at <= NOW()
       RETURNING id;`,
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Array.isArray(rows) ? rows.length : 0;
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
        RETURNING id, email, token, position, status, redeemed_at, expires_at, validated_at, invitation_link_id,
                  invitation_email_sent_at, welcome_email_sent_at, last_reminder_email_sent_at, reminder_count, language;`,
      [limit],
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return rows.map((row: WaitListSchema) => this.format(row));
  }

  /**
   * INVITED wait list rows that should receive reminder emails:
   * - a first reminder 2 days after the welcome email (if still not registered)
   * - a final reminder within 1 day of expiration
   * Sends are capped by `reminder_count` (max 2) and throttled by `last_reminder_email_sent_at` (12h guard).
   */
  async findInvitedDueForReminder(): Promise<InvitedDueForReminderRow[]> {
    const INVITED = 'INVITED';
    const invitationsLinksTable = TABLES_ENUM.INVITATION_LINKS;
    const benefitsTable = TABLES_ENUM.BENEFITS;

    const result = await Query.raw(
      `SELECT
        w.id,
        w.email,
        w.position,
        w.expires_at,
        w.welcome_email_sent_at,
        w.reminder_count,
        w.last_reminder_email_sent_at,
        w.language,
        il.code AS invitation_code,
        b.type AS benefit_type,
        b.trial_days
      FROM wait_list w
      JOIN ${invitationsLinksTable} il ON il.id = w.invitation_link_id
      JOIN ${benefitsTable} b ON b.id = il.benefit_id
      WHERE w.status = $1
        AND w.position IS NOT NULL
        AND w.expires_at IS NOT NULL
        AND w.expires_at > NOW()
        AND (
          (w.reminder_count = 0 AND w.welcome_email_sent_at <= NOW() - INTERVAL '2 days')
          OR (w.reminder_count < 2 AND w.expires_at <= NOW() + INTERVAL '1 day')
        )
        AND (
          w.last_reminder_email_sent_at IS NULL
          OR w.last_reminder_email_sent_at <= NOW() - INTERVAL '12 hours'
        )
      ORDER BY w.expires_at ASC, w.id ASC;`,
      [INVITED],
    );

    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return rows as InvitedDueForReminderRow[];
  }

  async markReminderSent(id: number, nextReminderCount: number, sentAt: Date = new Date()): Promise<WaitList> {
    return this.updateById(id, {
      reminder_count: nextReminderCount,
      last_reminder_email_sent_at: sentAt,
    });
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

  async findEmailByInvitationCode(code: string): Promise<string | null> {
    const result = await this.query()
      .select(['wait_list.email'])
      .join('invitation_link_id', 'invitation_links', 'id', 'INNER')
      .where('invitation_links.code', '=', code)
      .first<{ email: string }>();

    return result?.email ?? null;
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
      invitation_email_sent_at: result.invitation_email_sent_at,
      welcome_email_sent_at: result.welcome_email_sent_at,
      last_reminder_email_sent_at: result.last_reminder_email_sent_at,
      reminder_count: result.reminder_count,
      language: result.language,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
