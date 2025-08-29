import { Client } from './clients';
import { QueryBuilder } from './queryBuilder';
import { WhereOperator } from './types';

export class BaseRepository extends QueryBuilder {
  constructor(protected readonly tableName: string) {
    super(tableName);
  }
}
