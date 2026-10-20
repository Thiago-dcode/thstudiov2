import { Injectable } from '@nestjs/common';
import {
  EmailPreferenceSchemaWithoutTimestamps,
  EmailPreferenceSchemaColumns,
} from '@repo/common-lib/schemas/email-preferences';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
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

  constructor() {
    super(TABLES_ENUM.EMAIL_PREFERENCES);
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

    if (existing) {
      // `user_id` binds the row (and its token) to an account. It is set once, by the account
      // that owns this email, and never re-pointed: anything else lets a caller who names an
      // email (the public contact form did) move that person's row, token included, onto
      // another account.
      const { user_id, ...rest } = payload;
      const update = existing.user_id == null && user_id != null ? { ...rest, user_id } : rest;

      await this.query()
        .where('email', '=', payload.email)
        .update(Object.keys(update), Object.values(update));


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
