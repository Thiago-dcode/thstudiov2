import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { visibleAccountSql } from '@repo/common-lib/utils/artist-share-ready';
import { Query } from '@repo/database/facades';

/**
 * Guards a public `:user_id` param: 404 unless the account may appear publicly — not banned, not
 * deactivated, not pending deletion ({@link visibleAccountSql}). Place it after `ParseIntPipe`.
 */
@Injectable()
export class PublicAccountPipe implements PipeTransform<number, Promise<number>> {
  async transform(userId: number): Promise<number> {
    const result = await Query.raw(
      `SELECT 1 FROM ${TABLES_ENUM.USERS} u WHERE u.id = $1 AND ${visibleAccountSql('u')} LIMIT 1`,
      [userId],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new NotFoundException('Artist not found');
    }
    return userId;
  }
}
