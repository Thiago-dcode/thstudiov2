import { QueryBuilder } from '../builder/queryBuilder';
import { TableName } from '../constants/types/database';

export class BaseRepository extends QueryBuilder {
  constructor(protected readonly tableName: TableName) {
    super(tableName);
  }
}
