import { InvalidDatabaseClientException } from '../exceptions';
import { FullDatabaseConfig } from '../types';

// Mock the database drivers before importing the clients
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockReturnValue({
    getConnection: jest.fn().mockResolvedValue({}),
    end: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue([[], {}]),
  }),
}));

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    end: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  })),
}));

// Now import after mocking
const { MysqlClient, PostgresClient, initClient, Client, killClient } = require('../clients');

describe('Client Initialization', () => {
  const mysqlConfig: FullDatabaseConfig = {
    client: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'test',
  };

  const postgresConfig: FullDatabaseConfig = {
    client: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'test',
  };

  beforeEach(() => {
    // Clear any existing client instance
    jest.resetModules();
    // Reset the module to clear the singleton
    killClient();
  });

  describe('initClient function', () => {
    it('should create a MySQL client when mysql is specified', () => {
      const client = initClient(mysqlConfig);
      expect(client).toBeInstanceOf(MysqlClient);
    });

    it('should create a PostgreSQL client when postgres is specified', () => {
      const client = initClient(postgresConfig);
      expect(client).toBeInstanceOf(PostgresClient);
    });

    it('should throw an error for invalid client type', () => {
      const invalidConfig: FullDatabaseConfig = {
        ...mysqlConfig,
        client: 'invalid' as any,
      };
      
      expect(() => {
        return initClient(invalidConfig)
      }).toThrow(InvalidDatabaseClientException);
    });

    it('should return the same client instance on subsequent calls (singleton pattern)', () => {
      const client1 = initClient(mysqlConfig);
      const client2 = initClient(mysqlConfig);
      
      expect(client1).toBe(client2);
    });

    it('should return a new client instance when is called with different config', () => {
      const client1 = initClient(mysqlConfig);
      const client2 = initClient(postgresConfig);
      
      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(MysqlClient); 
      expect(client2).toBeInstanceOf(PostgresClient);
    });
  });

  describe('MysqlClient', () => {
    it('should be defined and instantiable', () => {
      const client = new MysqlClient(mysqlConfig);
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(MysqlClient);
    });

    it('should have correct configuration', () => {
      const client = new MysqlClient(mysqlConfig);
      expect(client).toBeInstanceOf(Client);
    });

    it('should implement required abstract methods', () => {
      const client = new MysqlClient(mysqlConfig);
      expect(typeof client.connect).toBe('function');
      expect(typeof client.disconnect).toBe('function');
      expect(typeof client.query).toBe('function');
    });
  });

  describe('PostgresClient', () => {
    it('should be defined and instantiable', () => {
      const client = new PostgresClient(postgresConfig);
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(PostgresClient);
    });

    it('should have correct configuration', () => {
      const client = new PostgresClient(postgresConfig);
      expect(client).toBeInstanceOf(Client);
    });

    it('should implement required abstract methods', () => {
      const client = new PostgresClient(postgresConfig);
      expect(typeof client.connect).toBe('function');
      expect(typeof client.disconnect).toBe('function');
      expect(typeof client.query).toBe('function');
    });
  });

 
});
