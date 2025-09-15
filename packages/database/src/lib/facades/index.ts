import { QueryBuilder } from '../builder/queryBuilder';
import SchemaBuilder from '../builder/schemaBuilder';
import { ColumnBuilder } from '../builder/columnBuilder';
import AlterBuilder from '../builder/alterBuilder';

class Schema extends SchemaBuilder {}
class Query extends QueryBuilder {}
class Column extends ColumnBuilder {}
class Alter extends AlterBuilder {}

export { Schema, Query, Column, Alter };
