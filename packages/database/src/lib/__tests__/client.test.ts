import { InvalidDatabaseClientException } from '../client/exceptions';
import { DatabaseConfig } from '../types';

// Mock the database drivers before importing the clients
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockReturnValue({
    getConnection: jest.fn().mockResolvedValue({}),
    end: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue([[], {}]),
  }),
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    end: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  })),
}));

// Now import after mocking
const { MysqlClient, PostgresClient, initClient, Client, killClient } = require('../client');

describe('Client Initialization', () => {
  const mysqlConfig: DatabaseConfig = {
    client: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'test',
  };

  const postgresConfig: DatabaseConfig = {
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
      const invalidConfig: DatabaseConfig = {
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

  describe('Settings Configuration Edge Cases', () => {
    const baseMysqlConfig: DatabaseConfig = {
      client: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test',
    };

    beforeEach(() => {
      jest.resetModules();
      killClient();
    });

    it('should use default settings when no settings are provided', () => {
      const client = initClient(baseMysqlConfig);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
      });
    });

    it('should merge partial settings with default settings', () => {
      const configWithPartialSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
        },
      };
      
      const client = initClient(configWithPartialSettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: false, // Should use default value
      });
    });

    it('should use provided settings when all settings are provided', () => {
      const configWithFullSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
          allowDeleteWithoutWhere: true,
        },
      };
      
      const client = initClient(configWithFullSettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: true,
      });
    });

    it('should handle empty settings object', () => {
      const configWithEmptySettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {},
      };
      
      const client = initClient(configWithEmptySettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
      });
    });

    it('should maintain settings consistency across multiple client initializations with same config', () => {
      const configWithSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
        },
      };
      
      const client1 = initClient(configWithSettings);
      const client2 = initClient(configWithSettings);
      
      expect(client1.config.settings).toEqual(client2.config.settings);
      expect(client1).toBe(client2); // Should be same instance due to singleton
    });

    it('should handle settings correctly when switching between different client types', () => {
      const mysqlConfigWithSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
        },
      };

      const postgresConfigWithSettings: DatabaseConfig = {
        client: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'test',
        settings: {
          allowDeleteWithoutWhere: true,
        },
      };
      
      const mysqlClient = initClient(mysqlConfigWithSettings);
      const postgresClient = initClient(postgresConfigWithSettings);
      
      expect(mysqlClient.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: false,
      });
      
      expect(postgresClient.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: true,
      });
    });
  });

 
});
