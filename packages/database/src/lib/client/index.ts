import { Pool } from 'mysql2/promise';
import {
  DatabaseClient,
  DatabaseConfig,
  FullDatabaseConfig,
} from '@repo/common-lib/types/database';
import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';
import {
  ClientNotInitializedException,
  InvalidDatabaseClientException,
} from './exceptions';
import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
import { setDatabaseCliConfig } from '../scripts/utils/config';
export abstract class Client<T> {
  protected client: T | null = null;
  protected _initialized: boolean = false;

  constructor(protected _config: FullDatabaseConfig) {
    // Don't call setup() in constructor - it's async
    // Setup will be called by initClient after construction
  }

  protected abstract setup(): Promise<void>;
  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract query(query: string, values?: any[]): Promise<any>;

  protected throwIfNotInitialized() {
    if (!this._initialized || !this.client) {
      throw new ClientNotInitializedException();
    }
  }

  public async initialize(): Promise<void> {
    await this.setup();
    this._initialized = true;
  }
  public set config(config: FullDatabaseConfig) {
    this._config = config;
  }
  public get config() {
    return this._config;
  }
  public get initialized() {
    return this.client && this._initialized;
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
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    
    });

    // Set timezone to UTC for all connections to ensure consistent timestamp handling
    // All timestamps are stored in UTC and should be converted to local time only for display
    this.client.on('connect', (client) => {
      client.query('SET timezone = "UTC"');
    });
  }

  public async connect(): Promise<void> {
    // For pools, we don't need to explicitly connect
    // The pool manages connections automatically
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
  setDatabaseCliConfig(fullConfig.settings);
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
  if (!client.initialized) await client.initialize();
  return client;
};

export const killClient = async () => {
  if (client) {
    await client.disconnect();
  }
  client = null;
  clientChoosen = null;
};

export const getClient = () => {
  if (!client) {
    throw new ClientNotInitializedException();
  }
  return client;
};

export const getClientConfig = () => clientChoosen;
