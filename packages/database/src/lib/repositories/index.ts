import { QueryBuilder } from '../builder/queryBuilder';
import { SqlClause, TableName } from '../constants/types';

export class BaseRepository extends QueryBuilder {
  constructor(protected readonly tableName: TableName) {
    super(tableName);
  }
}
