import { Pool, QueryResult } from 'mysql2/promise';
import { DatabaseClient, DatabaseConfig, FullDatabaseConfig } from '../types';
import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';
import {
  ClientNotInitializedException,
  InvalidDatabaseClientException,
} from './exceptions';
import { DEFAULT_DATABASE_SETTINGS } from '../constants';
import { setMigrationConfig } from '../migration/config';
export abstract class Client<T> {
  protected client: T | null = null;
  private initialized: boolean = false;

  constructor(protected _config: FullDatabaseConfig) {
    // Don't call setup() in constructor - it's async
    // Setup will be called by initClient after construction
  }

  protected abstract setup(): Promise<void>;
  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract query(query: string, values?: any[]): Promise<any>;

  protected throwIfNotInitialized() {
    if (!this.initialized || !this.client) {
      throw new ClientNotInitializedException();
    }
  }

  public async initialize(): Promise<void> {
    await this.setup();
    this.initialized = true;
  }
  public set config(config: FullDatabaseConfig) {
    this._config = config;
  }
  public get config() {
    return this._config;
  }
}

export class MysqlClient extends Client<Pool> {
  constructor(config: FullDatabaseConfig) {
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

  public async query(query: string, values?: any[]) {
    return await this.client?.query(query, values);
  }
}

export class PostgresClient extends Client<PgPool> {
  constructor(config: FullDatabaseConfig) {
    super(config);
  }

  protected async setup(): Promise<void> {
    this.client = new PgPool({
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
export const initClient = async (config: DatabaseConfig) => {
  // Create a new config object with default settings merged
  const fullConfig: FullDatabaseConfig = {
    ...config,
    settings: {
      ...DEFAULT_DATABASE_SETTINGS,
      ...config?.settings,
    },
  };
  setMigrationConfig(fullConfig.settings);
  if (client && clientChoosen === fullConfig.client) {
    client.config = fullConfig;
    return client;
  }

  clientChoosen = fullConfig.client;

  switch (fullConfig.client) {
    case 'mysql':
      client = new MysqlClient(fullConfig);
      break;
    case 'postgres':
      client = new PostgresClient(fullConfig);
      break;
    default:
      throw new InvalidDatabaseClientException();
  }
  // Initialize the client after construction
  await client.initialize();
  return client;
};

export const killClient = async () => {
  if (client) {
    await client.disconnect();
  }
  client = null;
  clientChoosen = null;
};

// Export a getter function instead of the static client
export const getClient = () => client;
