import { BadRequestException } from '@nestjs/common';
import type { TableName } from '@repo/common-lib/types/database';
import { Query } from '@repo/database/facades';

/**
 * Throws unless every id in `ids` is a row of `table` owned by `userId`.
 *
 * DTO `@ModelExist` checks only that a row exists, so an id list attached to an owned
 * entity (media in a collection, collections in a portfolio, ...) needs this on top:
 * otherwise any artist can pull another artist's media, including switched-off media,
 * into their own collection and read it back with signed URLs.
 */
export async function assertOwnedIds(
  table: TableName,
  ids: number[],
  userId: number,
  label: string,
): Promise<void> {
  const unique = [...new Set(ids)];
  if (!unique.length) return;
  const owned = await Query.table(table)
    .whereIn('id', unique)
    .where('user_id', '=', userId)
    .count();
  if (owned !== unique.length) {
    throw new BadRequestException(`${label} not found`);
  }
}
