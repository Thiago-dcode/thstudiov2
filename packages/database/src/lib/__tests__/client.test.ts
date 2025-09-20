import { InvalidDatabaseClientException } from '../client/exceptions';
import { DatabaseConfig } from '../constants/schemas/database';

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
import { MysqlClient, PostgresClient, initClient, Client, killClient } from '../client';

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

  beforeEach(async () => {
    // Clear any existing client instance
    jest.resetModules();
    // Reset the module to clear the singleton
    await killClient();
  });

  describe('initClient function', () => {
    it('should create a MySQL client when mysql is specified', async () => {
      const client = await initClient(mysqlConfig);
      expect(client).toBeInstanceOf(MysqlClient);
    });

    it('should create a PostgreSQL client when postgres is specified', async () => {
      const client = await initClient(postgresConfig);
      expect(client).toBeInstanceOf(PostgresClient);
    });

    it('should throw an error for invalid client type', async () => {
      const invalidConfig: DatabaseConfig = {
        ...mysqlConfig,
        client: 'invalid' as any,
      };
      
      await expect(async () => {
        return await initClient(invalidConfig)
      }).rejects.toThrow(InvalidDatabaseClientException);
    });

    it('should return the same client instance on subsequent calls (singleton pattern)', async () => {
      const client1 = await initClient(mysqlConfig);
      const client2 = await initClient(mysqlConfig);
      
      expect(client1).toBe(client2);
    });

    it('should return a new client instance when is called with different config', async () => {
      const client1 = await initClient(mysqlConfig);
      const client2 = await initClient(postgresConfig);
      
      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(MysqlClient); 
      expect(client2).toBeInstanceOf(PostgresClient);
    });
  });

  describe('MysqlClient', () => {
    const fullMysqlConfig = {
      ...mysqlConfig,
      settings: {
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: 'migrations',
        seedDirectory: 'seeds',
      },
    };

    it('should be defined and instantiable', () => {
      const client = new MysqlClient(fullMysqlConfig);
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(MysqlClient);
    });

    it('should have correct configuration', () => {
      const client = new MysqlClient(fullMysqlConfig);
      expect(client).toBeInstanceOf(Client);
    });

    it('should implement required abstract methods', () => {
      const client = new MysqlClient(fullMysqlConfig);
      expect(typeof client.connect).toBe('function');
      expect(typeof client.disconnect).toBe('function');
      expect(typeof client.query).toBe('function');
    });
  });

  describe('PostgresClient', () => {
    const fullPostgresConfig = {
      ...postgresConfig,
      settings: {
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: 'migrations',
        seedDirectory: 'seeds',
      },
    };

    it('should be defined and instantiable', () => {
      const client = new PostgresClient(fullPostgresConfig);
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(PostgresClient);
    });

    it('should have correct configuration', () => {
      const client = new PostgresClient(fullPostgresConfig);
      expect(client).toBeInstanceOf(Client);
    });

    it('should implement required abstract methods', () => {
      const client = new PostgresClient(fullPostgresConfig);
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

    beforeEach(async () => {
      jest.resetModules();
      await killClient();
    });

    it('should use default settings when no settings are provided', async () => {
      const client = await initClient(baseMysqlConfig);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: expect.any(String),
        seedDirectory: expect.any(String),
      });
    });

    it('should merge partial settings with default settings', async () => {
      const configWithPartialSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
        },
      };
      
      const client = await initClient(configWithPartialSettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: false, // Should use default value
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: expect.any(String),
        seedDirectory: expect.any(String),
      });
    });

    it('should use provided settings when all settings are provided', async () => {
      const configWithFullSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
          allowDeleteWithoutWhere: true,
          allowTruncate: true,
          allowDrop: true,
          migrationsDirectory: 'custom-migrations',
        },
      };
      
      const client = await initClient(configWithFullSettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: true,
        allowTruncate: true,
        allowDrop: true,
        migrationsDirectory: 'custom-migrations',
        seedDirectory: expect.any(String),
      });
    });

    it('should handle empty settings object', async () => {
      const configWithEmptySettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {},
      };
      
      const client = await initClient(configWithEmptySettings);
      expect(client.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: false,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: expect.any(String),
        seedDirectory: expect.any(String),
      });
    });

    it('should maintain settings consistency across multiple client initializations with same config', async () => {
      const configWithSettings: DatabaseConfig = {
        ...baseMysqlConfig,
        settings: {
          allowUpdateWithoutWhere: true,
        },
      };
      
      const client1 = await initClient(configWithSettings);
      const client2 = await initClient(configWithSettings);
      
      expect(client1.config.settings).toEqual(client2.config.settings);
      expect(client1).toBe(client2); // Should be same instance due to singleton
    });

    it('should handle settings correctly when switching between different client types', async () => {
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
      
      const mysqlClient = await initClient(mysqlConfigWithSettings);
      const postgresClient = await initClient(postgresConfigWithSettings);
      
      expect(mysqlClient.config.settings).toEqual({
        allowUpdateWithoutWhere: true,
        allowDeleteWithoutWhere: false,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: expect.any(String),
        seedDirectory: expect.any(String),
      });
      
      expect(postgresClient.config.settings).toEqual({
        allowUpdateWithoutWhere: false,
        allowDeleteWithoutWhere: true,
        allowTruncate: false,
        allowDrop: false,
        migrationsDirectory: expect.any(String),
        seedDirectory: expect.any(String),
      });
    });
  });

 
});
