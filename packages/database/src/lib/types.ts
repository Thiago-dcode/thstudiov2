export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};
export type DatabaseClient = 'postgres' | 'mysql' | 'sqlite' | 'mongodb';

export type FullDatabaseConfig = DatabaseConfig & {
  client: DatabaseClient;
};

export type WhereOperator =
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
