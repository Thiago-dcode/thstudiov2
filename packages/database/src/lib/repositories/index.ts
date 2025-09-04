import { Client } from 'lib/client';
import { QueryBuilder } from 'lib/queryBuilder';
import { WhereOperator } from 'lib/types';

export class BaseRepository extends QueryBuilder {
  constructor(protected readonly tableName: string) {
    super(tableName);
  }
}
