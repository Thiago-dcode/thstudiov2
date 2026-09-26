import type { SqlValue, TableName } from '@repo/common-lib/types/database';
import { DbException } from '@repo/database/exceptions';
import { Query } from '@repo/database/facades';

/**
 * One `INSERT … ON CONFLICT (…) DO UPDATE … RETURNING` statement — the find-or-create every
 * place table needs.
 *
 * The hierarchy used to find-then-insert, which let two concurrent saves of the same place
 * mint twin rows. Postgres resolving the conflict against the unique index closes that window,
 * and `DO UPDATE` (rather than `DO NOTHING`) is what guarantees `RETURNING` yields the row in
 * both outcomes. `update` lists the columns refreshed from the incoming row on conflict; when
 * empty, the first conflict column is re-assigned to itself so the row is still returned.
 *
 * Identifiers come from the calling repository, never from user input; values are bound.
 */
export async function upsertReturning<T>(args: {
  table: TableName;
  row: Record<string, SqlValue>;
  conflict: string[];
  update?: string[];
  returning: string[];
}): Promise<T> {
  const columns = Object.keys(args.row);
  const values = Object.values(args.row);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const update = args.update?.length
    ? args.update.map((column) => `${column} = EXCLUDED.${column}`)
    : [`${args.conflict[0]} = EXCLUDED.${args.conflict[0]}`];
  const returning = args.returning.map((column) => column.replace(/^\w+\./, ''));

  const result = await Query.raw(
    `INSERT INTO ${args.table} (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     ON CONFLICT (${args.conflict.join(', ')})
     DO UPDATE SET ${[...update, 'updated_at = NOW()'].join(', ')}
     RETURNING ${returning.join(', ')}`,
    values as (string | number | null)[],
  );
  const row = (result?.rows ?? [])[0] as T | undefined;
  if (!row) {
    throw new DbException(`Could not upsert into ${args.table}`);
  }
  return row;
}
