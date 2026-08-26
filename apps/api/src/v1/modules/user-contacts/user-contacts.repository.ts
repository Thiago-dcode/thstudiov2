import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { UserContactSchema, UserContactSchemaColumns } from '@repo/common-lib/schemas/user-contact';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DEFAULT_USER_CONTACT_ORDER_BY } from '@repo/common-lib/constants/user-contact';
import { RequestService } from 'src/common/services/request.service';
import { IndexUserContactRequest } from './requests/index-user-contact.request';

@Injectable()
export class UserContactsRepository extends BaseRepository {
  private readonly COLUMNS: UserContactSchemaColumns[] = [
    'user_contacts.id',
    'user_contacts.contact_name',
    'user_contacts.contact_email',
    'user_contacts.user_id',
    'user_contacts.message',
    'user_contacts.subject',
    'user_contacts.created_at',
    'user_contacts.updated_at',
  ];

  constructor(
    private readonly requestService: RequestService,
    protected readonly logService: LogService,
  ) {
    super(TABLES_ENUM.USER_CONTACTS, logService);
  }

  async findAll(
    userId: number,
    filters: IndexUserContactRequest = {},
  ): Promise<UserContactSchema[]> {
    const query = this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId);

    this.applyWhereFilters(query, filters);

    // Before `handleOffsetPagination`, which appends the primary key as a tiebreaker so rows with
    // an identical sort value keep a stable order across pages.
    query.orderBy(
      filters.order_by || DEFAULT_USER_CONTACT_ORDER_BY,
      filters.order || 'DESC',
    );

    this.requestService.pagination = await this.handleOffsetPagination(
      query,
      filters,
    );

    return await query.get<UserContactSchema[]>();
  }

  private applyWhereFilters(query: QueryBuilder, filters: IndexUserContactRequest): void {
    if (filters.search) {
      const search = `%${filters.search.toLowerCase()}%`;
      query.whereGroup([
        ['user_contacts.contact_name', 'ILIKE', search, 'where'],
        ['user_contacts.contact_email', 'ILIKE', search, 'orWhere'],
        ['user_contacts.subject', 'ILIKE', search, 'orWhere'],
        ['user_contacts.message', 'ILIKE', search, 'orWhere'],
      ]);
    }

    if (filters.contact_email) {
      query.where('user_contacts.contact_email', '=', filters.contact_email);
    }

    if (filters.created_from) {
      query.where('user_contacts.created_at', '>=', filters.created_from);
    }

    if (filters.created_to) {
      query.where('user_contacts.created_at', '<=', filters.created_to);
    }
  }

  async findOne(id: number): Promise<UserContactSchema | null> {
    return await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserContactSchema>();
  }

  async findManyByIds(ids: number[]): Promise<UserContactSchema[]> {
    if (!ids.length) return [];
    return await this.query()
      .select(this.COLUMNS)
      .whereIn('user_contacts.id', ids)
      .get<UserContactSchema[]>();
  }

  async create(data: Partial<UserContactSchema>): Promise<UserContactSchema> {
    const result = await super._create<UserContactSchema>(data, {
      select: this.COLUMNS,
    });
    return result;
  }

  async updateOne(id: number, data: Partial<UserContactSchema>): Promise<UserContactSchema> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    if (columns.length > 0) {
       await this.query()
      .where('id', '=', id)
      .update(columns, values);
    }
   
    const result = await this.findOne(id);
    if (!result) throw new NotFoundException('User contact not found');
    return result;
  }
}
