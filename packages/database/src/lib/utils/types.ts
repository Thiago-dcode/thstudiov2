import { EnumType } from 'typescript';
import { ENUMS, SQL_FUNCTIONS, TABLES } from './constants';

export type DatabaseClient = 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
export type DatabaseSettings = {
  allowUpdateWithoutWhere: boolean;
  allowDeleteWithoutWhere: boolean;
  migrationsDirectory: string;
};
export type DatabaseConfig = {
  client: DatabaseClient;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  settings?: Partial<DatabaseSettings>;
};
export type FullDatabaseConfig = DatabaseConfig & {
  settings: Required<DatabaseSettings>;
};
export type SqlValue = string | number | null | EnumType | Date | boolean;
export type SqlClause =
  | '='
  | '>'
  | '<'
  | '>='
  | '<='
  | '!='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IN'
  | 'NOT IN'
  | 'IS'
  | 'IS NOT';
export type SqlOperation =
  | 'where'
  | 'join'
  | 'select'
  | 'limit'
  | 'orderBy'
  | 'groupBy'
  | 'having'
  | 'offset'
  | 'distinct';
export type SqlClauseWithoutIn = Exclude<SqlClause, 'IN' | 'NOT IN'>;
export type WhereType = 'where' | 'orWhere';

// Base interface
export type BaseWhere = {
  column: string;
  position: number;
};

// Regular WHERE condition
export type WhereCondition = BaseWhere & {
  type: WhereType;
  operator: SqlClauseWithoutIn;
};

// WHERE IN condition
export type WhereInCondition = BaseWhere & {
  type: WhereType;
  operator: 'IN' | 'NOT IN';
  values: SqlValue[];
};

// Union type
export type Where = WhereCondition | WhereInCondition;

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
export type Join = {
  type: JoinType;
  localColumn: string;
  foreignTable: string;
  foreignColumn: string;
};

export type TableName = (typeof TABLES)[number];

export type AvailableEnums = typeof ENUMS;
export type SqlFunction = (typeof SQL_FUNCTIONS)[number];
export type SqlFunctionTimestamp = Extract<SqlFunction, 'NOW()' | 'CURRENT_TIMESTAMP' | 'CURRENT_DATE' | 'CURRENT_TIME'>;