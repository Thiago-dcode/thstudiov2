import { Client } from 'lib/client';
import { QueryBuilder } from 'lib/builder/queryBuilder';
import { SqlClause } from 'lib/utils/types';

export class BaseRepository extends QueryBuilder {
  constructor(protected readonly tableName: string) {
    super(tableName);
  }
}
