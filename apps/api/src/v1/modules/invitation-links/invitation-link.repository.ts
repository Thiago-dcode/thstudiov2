import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  InvitationLinkSchema,
  InvitationLinkSchemaColumns,
  InvitationLinkWithBenefitSchema,
  InvitationLinkWithBenefitSchemaColumns,
} from '@repo/common-lib/schemas/invitation-link';
import {
  InvitationLink,
  FullInvitationLink,
  CreateInvitationLinkInput,
  UpdateInvitationLinkInput,
} from '@repo/common-lib/types/invitation-link';
import { DbException } from '@repo/database/exceptions';
import { IndexInvitationLinkRequest } from './requests/index-invitation-link.request';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class InvitationLinkRepository extends BaseRepository {
  private readonly COLUMNS: InvitationLinkSchemaColumns[] = [
    'invitation_links.id',
    'invitation_links.code',
    'invitation_links.benefit_id',
    'invitation_links.max_uses',
    'invitation_links.current_uses',
    'invitation_links.expires_at',
    'invitation_links.active',
  ] as const;

  private readonly FULL_COLUMNS: InvitationLinkWithBenefitSchemaColumns[] = [
    ...this.COLUMNS,
    'benefits.id as b_id',
    'benefits.type',
    'benefits.name',
    'benefits.trial_days',
    'benefits.stripe_coupon_id',
    'benefits.active as b_active',
  ] as const;

  constructor(private readonly requestService: RequestService) {
    super('invitation_links');
  }

  async getAll(filters: IndexInvitationLinkRequest): Promise<FullInvitationLink[]> {
    const query = this.query()
      .select(this.FULL_COLUMNS)
      .join('benefit_id', 'benefits', 'id', 'LEFT');

    if (filters.benefit_type) {
      query.where('benefits.type', '=', filters.benefit_type);
    }
    if (typeof filters.active === 'boolean') {
      query.where('invitation_links.active', filters.active);
    }

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);
    query.orderBy('invitation_links.id', 'DESC');

    const results = await query.get<InvitationLinkWithBenefitSchema[]>();
    return results.map((r) => this.formatFull(r));
  }

  async findByCode(code: string): Promise<InvitationLink | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('code', '=', code)
      .first<InvitationLinkSchema>();

    return result ? this.format(result) : null;
  }

  async updateById(id: number, data: UpdateInvitationLinkInput): Promise<InvitationLink> {
    const cols = Object.keys(data);
    const values = Object.values(data);

    if (cols.length && values.length) {
      await this.query().where('id', '=', id).update(cols, values);
    }

    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<InvitationLinkSchema>();

    if (!result) {
      throw new DbException('Could not update invitation link');
    }

    return this.format(result);
  }

  async create(data: CreateInvitationLinkInput): Promise<InvitationLink> {
    const cols = Object.keys(data);
    const values = Object.values(data);

    const result = await this.query().insertAndGet<InvitationLinkSchema>(cols, values);

    if (!result) {
      throw new DbException('Could not create invitation link');
    }

    return this.format(result);
  }

  private format(result: InvitationLinkSchema): InvitationLink {
    return {
      id: result.id,
      code: result.code,
      benefit_id: result.benefit_id,
      max_uses: result.max_uses,
      current_uses: result.current_uses,
      expires_at: result.expires_at,
      active: result.active,
    };
  }

  private formatFull(row: InvitationLinkWithBenefitSchema): FullInvitationLink {
    return {
      id: row.id,
      code: row.code,
      benefit_id: row.benefit_id,
      max_uses: row.max_uses,
      current_uses: row.current_uses,
      expires_at: row.expires_at,
      active: row.active,
      benefit: {
        id: row.b_id,
        type: row.type,
        name: row.name,
        trial_days: row.trial_days,
        stripe_coupon_id: row.stripe_coupon_id,
        active: row.b_active,
      },
    };
  }
}
