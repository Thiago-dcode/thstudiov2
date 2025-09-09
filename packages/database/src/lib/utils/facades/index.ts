import { QueryBuilder } from '../../builder/queryBuilder';
import SchemaBuilder from '../../builder/schemaBuilder';
import { ColumnBuilder } from '../../builder/columnBuilder';
import { TableName } from '../types';

class Schema {
  public static table(tableName: TableName) {
    return SchemaBuilder.table(tableName);
  }
}
class Query {
  public static table(tableName: TableName) {
    return QueryBuilder.table(tableName);
  }
}
class Column extends ColumnBuilder {}

export { Schema, Query, Column };
