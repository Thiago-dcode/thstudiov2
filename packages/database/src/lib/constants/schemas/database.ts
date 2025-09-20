import { ENUMS, SQL_FUNCTIONS, TABLES } from '../constants';

export type DatabaseClient = 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
export type DatabaseSettings = {
  allowUpdateWithoutWhere: boolean;
  allowDeleteWithoutWhere: boolean;
  allowTruncate: boolean;
  allowDrop: boolean;
  migrationsDirectory: string;
  seedDirectory: string;
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
export type EnumType<T extends keyof typeof ENUMS> = (typeof ENUMS)[T][number];
export type SqlValue =
  | string
  | number
  | null
  | Date
  | boolean
  | undefined
  | EnumType<keyof typeof ENUMS>;
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
  value: SqlValue;
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
export type AvailableEnums = typeof ENUMS;
export type SqlTypes =
  | 'INTEGER'
  | 'REAL'
  | 'DOUBLE PRECISION'
  | 'DECIMAL'
  | `DECIMAL(${number},${number})`
  | 'BIGINT'
  | 'BOOLEAN'
  | 'VARCHAR'
  | 'TEXT'
  | 'TIMESTAMP'
  | 'DATE'
  | 'TIME'
  | `${keyof AvailableEnums}`;
export type TableName = (typeof TABLES)[number];

export type SqlFunction = (typeof SQL_FUNCTIONS)[number];
export type SqlFunctionTimestamp =
  | Extract<
      SqlFunction,
      'NOW()' | 'CURRENT_TIMESTAMP' | 'CURRENT_DATE' | 'CURRENT_TIME'
    >
  | (string & {});


  export type OnAction = 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION';

export type ColumnAttributes<
  T = string | number | boolean | null | SqlFunction,
> = {
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  default?: T | null;
};
export type ColumnAttributesOrAutoIncrement =
  | ColumnAttributes
  | {
      autoIncrement?: boolean;
      primaryKey?: boolean;
    };

export type ColumnAttributesWithType = ColumnAttributes & {
  type?: SqlTypes;
};
export type ColumnAttributesWithForeignKey = Exclude<
  ColumnAttributesWithType,
  'primaryKey'
> & {
  constraintName?: string;
  onDelete?: OnAction;
  onUpdate?: OnAction;
};


export type ColumnAttributesWithAfter = Exclude<ColumnAttributesWithType, 'primaryKey'> & {
  after?: string;
};
