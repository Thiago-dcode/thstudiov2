import { QueryBuilder } from '../../builder/queryBuilder';
import SchemaBuilder from '../../builder/schemaBuilder';
import { ColumnBuilder } from '../../builder/columnBuilder';

class Schema extends SchemaBuilder {}
class Query extends QueryBuilder {}
class Column extends ColumnBuilder {}

export { Schema, Query, Column };
