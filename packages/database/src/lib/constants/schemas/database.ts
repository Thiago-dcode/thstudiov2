import { SQL_FUNCTIONS, TABLES_ENUM } from '../constants';
import { EnumType, AvailableEnums } from '@repo/common-lib/constants/enums';

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
export type SqlValue =
  | string
  | number
  | null
  | Date
  | boolean
  | undefined
  | EnumType<AvailableEnums>;
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
  foreignTable: TableName;
  foreignColumn: string;
};

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
  | `${AvailableEnums}`;
export type TableName = (typeof TABLES_ENUM)[keyof typeof TABLES_ENUM];

export type SqlFunction = (typeof SQL_FUNCTIONS)[number];
export type SqlFunctionTimestamp =
  | Extract<
      SqlFunction,
      'NOW()' | 'CURRENT_TIMESTAMP' | 'CURRENT_DATE' | 'CURRENT_TIME'
    >
  | (string & {});


  export type OnAction = 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION';

export type ColumnAttributes<
  T =  number | boolean | SqlFunction | EnumType<any>,
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

// Column Definition Types
export type ColumnDefinition = 
  // Basic SQL Types
  | 'INTEGER'
  | 'REAL'
  | 'DOUBLE PRECISION'
  | 'DECIMAL'
  | 'BIGINT'
  | 'BOOLEAN'
  | 'TEXT'
  | 'TIMESTAMP'
  | 'DATE'
  | 'TIME'
  // VARCHAR with length
  | `VARCHAR(${number})`
  // DECIMAL with precision
  | `DECIMAL(${number},${number})`
  // Auto-increment types
  | 'SERIAL'
  // Enum types
  | `${AvailableEnums}`
  | (string & {});


  export type  TableColumn<K extends readonly TableName[] ,T extends {[key:string]: any}> = `${K[number]}.${keyof T & string}` | `${K[number]}.${keyof T & string} as ${keyof T & string}`;