import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { UserContactSchema, UserContactSchemaColumns } from '@repo/common-lib/schemas/user-contact';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';

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

  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.USER_CONTACTS, logService);
  }

  async findAll(userId: number): Promise<UserContactSchema[]> {
    return await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .get<UserContactSchema[]>();
  }

  async findOne(id: number): Promise<UserContactSchema | null> {
    return await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserContactSchema>();
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
