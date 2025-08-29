import { Pool } from 'mysql2/promise';
import { DatabaseClient, DatabaseConfig, FullDatabaseConfig } from './types';
import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import {
  ClientNotInitializedException,
  InvalidDatabaseClientException,
} from './exceptions';
export abstract class Client<T> {
  protected client: T | null = null;
  constructor(protected readonly config: DatabaseConfig) {
    this.setup();
    this.throwIfNotInitialized();
  }
  protected abstract setup(): Promise<void>;
  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract query(query: string, values?: any[]): Promise<any>;
  protected throwIfNotInitialized() {
    if (!this.client) {
      throw new ClientNotInitializedException();
    }
  }
}

export class MysqlClient extends Client<Pool> {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  protected async setup(): Promise<void> {
    this.client = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
    });
  }

  public async connect(): Promise<void> {
    await this.client?.getConnection();
  }

  public async disconnect(): Promise<void> {
    await this.client?.end();
  }

  public async query(query: string, values?: any[]): Promise<any> {
    return await this.client?.query(query, values);
  }
}

export class PostgresClient extends Client<PgClient> {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  protected async setup(): Promise<void> {
    this.client = new PgClient({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
    });
  }

  public async connect(): Promise<void> {
    await this.client?.connect();
  }

  public async disconnect(): Promise<void> {
    await this.client?.end();
  }

  public async query(query: string, values?: any[]): Promise<any> {
    return await this.client?.query(query, values);
  }
}

let client: Client<any> | null = null;
let clientChoosen: DatabaseClient | null = null;
export const initClient = (config: FullDatabaseConfig) => {
  if (client && clientChoosen === config.client) return client;
  clientChoosen = config.client;
  switch (config.client) {
    case 'mysql':
      client = new MysqlClient(config);
      break;
    case 'postgres':
      client = new PostgresClient(config);
      break;
    default:
      throw new InvalidDatabaseClientException();
  }
  return client;
};

export const killClient = async () => {
  if (client) {
    await client.disconnect();
  }
  client = null;
  clientChoosen = null;
};

export default client;
