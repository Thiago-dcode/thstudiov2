import { Injectable } from '@nestjs/common';
import {
  EmailPreferenceSchemaWithoutTimestamps,
  EmailPreferenceSchemaColumns,
} from '@repo/common-lib/schemas/email-preferences';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { LogService } from '@repo/backend-lib/services/log-service';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { DbException } from '@repo/database/exceptions';

type UpsertPayload = {
  email: string;
  user_id?: number;
  transactional?: boolean;
  marketing?: boolean;
  notifications?: boolean;
  waitlist_updates?: boolean;
};

@Injectable()
export class EmailPreferencesRepository extends BaseRepository {
  private readonly COLUMNS: EmailPreferenceSchemaColumns[] = [
    `${TABLES_ENUM.EMAIL_PREFERENCES}.id`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.email`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.token`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.user_id`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.transactional`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.marketing`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.notifications`,
    `${TABLES_ENUM.EMAIL_PREFERENCES}.waitlist_updates`,
  ] as const;

  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.EMAIL_PREFERENCES, logService);
  }

  async findByColumn(
    column: 'email' | 'token' | 'user_id',
    value: string | number,
  ): Promise<EmailPreferenceSchemaWithoutTimestamps | null> {
    // Note: `this.COLUMNS` contains fully-qualified column names.
    // `BaseRepository._findOneBy` supports `select` to limit returned fields.
    return await this._findOneBy<EmailPreferenceSchemaWithoutTimestamps>(
      column,
      value,
      { select: this.COLUMNS as unknown as string[] },
    );
  }

  async findOneByEmail(email: string): Promise<EmailPreferenceSchemaWithoutTimestamps | null> {
    return await this.findByColumn('email', email);
  }

  /**
   * Upserts by email.
   * - If row exists: updates only explicitly provided columns (undefined is ignored).
   * - If row doesn't exist: generates token server-side.
   */
  async upsertByEmail(payload: UpsertPayload): Promise<EmailPreferenceSchemaWithoutTimestamps> {
    const existing = await this.findOneByEmail(payload.email);
    const cols = Object.keys(payload);
    const values = Object.values(payload);

    if (existing) {

      await this.query().where('email', '=', payload.email).update(cols, values);


      const updated = await this.findOneByEmail(payload.email);
      if (!updated) {
        throw new DbException('Could not fetch updated email preference');
      }
      return updated;
    }




    const result = await super._create<EmailPreferenceSchemaWithoutTimestamps>({ ...payload, token: await generateUUID() }, {
      select: this.COLUMNS,
    });

    if (!result) {
      throw new DbException('Could not create email preference');
    }
    return result;
  }
}
