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

/**
 * Splits `ids` into the ones that do not exist and the ones that exist but belong to someone
 * else, with ONE query. Lets a caller treat a foreign id as suspicious (log it) while answering
 * both cases with the same message, so the response is not an ownership oracle.
 */
export async function classifyOwnedIds(
  table: TableName,
  ids: number[],
  userId: number,
): Promise<{ missing: number[]; foreign: number[] }> {
  const unique = [...new Set(ids)];
  if (!unique.length) return { missing: [], foreign: [] };
  const rows: { id: number; user_id: number }[] = await Query.table(table)
    .select(['id', 'user_id'])
    .whereIn('id', unique)
    .get();
  const found = new Map(rows.map((row) => [Number(row.id), Number(row.user_id)]));
  const missing: number[] = [];
  const foreign: number[] = [];
  for (const id of unique) {
    const owner = found.get(id);
    if (owner === undefined) missing.push(id);
    else if (owner !== userId) foreign.push(id);
  }
  return { missing, foreign };
}
