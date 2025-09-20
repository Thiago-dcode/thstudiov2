import {
  DatabaseClient,
  DatabaseConfig,
  FullDatabaseConfig,
  TableName,
} from '../constants/schemas/database';
import { DEFAULT_DATABASE_SETTINGS } from '../constants/constants';
import AlterBuilder from '../builder/alterBuilder';
import { ColumnBuilder } from '../builder/columnBuilder';
import { ColumnAttributesWithForeignKey } from '../constants/schemas/database';

jest.mock('../client', () => {
  const Client = (config: FullDatabaseConfig) => {
    return {
      _config: config,
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      set config(config: FullDatabaseConfig) {
        this._config = config;
      },
      get config() {
        return this._config;
      },
    };
  };
  let mockClient: any = null;
  let currentClientType: DatabaseClient | null = null;

  return {
    __esModule: true,
    initClient: jest.fn(async (config: DatabaseConfig) => {
      config.settings = {
        ...DEFAULT_DATABASE_SETTINGS,
        ...config?.settings,
      };
      const fullConfig: FullDatabaseConfig = {
        ...config,
        settings: {
          ...DEFAULT_DATABASE_SETTINGS,
          ...config?.settings,
        },
      };
      if (mockClient && mockClient.config.client === config.client) {
        mockClient.config = fullConfig;
        return mockClient;
      }
      switch (config.client) {
        case 'postgres':
          mockClient = Client(fullConfig);
          currentClientType = 'postgres';
          break;
        case 'mysql':
          mockClient = Client(fullConfig);
          currentClientType = 'mysql';
          break;
      }
      return mockClient;
    }),
    getClient: jest.fn(() => {
      return mockClient;
    }),
    getClientConfig: jest.fn(() => {
      return currentClientType;
    }),
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    killClient: jest.fn(async () => {
      mockClient = null;
      currentClientType = null;
    }),
  };
});

describe('AlterBuilder', () => {
  let mockClient: any;
  let testConfig: DatabaseConfig;
  const TABLE_NAME = 'users';

  beforeEach(async () => {
    // Setup test configuration
    testConfig = {
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
      client: 'postgres',
    };

    // Get the mocked client
    const { initClient, getClient } = require('../client');
    await initClient(testConfig);
    mockClient = getClient();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Clean up after each test
    const { killClient } = require('../client');
    await killClient();
  });

  describe('Static Methods', () => {
    it('should create instance using static table method', () => {
      // Act
      const alterBuilder = AlterBuilder.table(TABLE_NAME);

      // Assert
      expect(alterBuilder).toBeInstanceOf(AlterBuilder);
      expect(alterBuilder['tableName']).toBe(TABLE_NAME);
    });

    it('should create multiple instances with different table names', () => {
      // Act
      const builder1 = AlterBuilder.table('users');
      const builder2 = AlterBuilder.table('collection_translations');

      // Assert
      expect(builder1['tableName']).toBe('users');
      expect(builder2['tableName']).toBe('collection_translations');
      expect(builder1).not.toBe(builder2);
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with a valid client and call connect', () => {
      // Act & Assert
      expect(() => new AlterBuilder(TABLE_NAME)).not.toThrow();
      expect(mockClient.connect).toHaveBeenCalledTimes(0);
    });

    it('should initialize with empty query string', () => {
      // Act
      const alterBuilder = new AlterBuilder(TABLE_NAME);

      // Assert
      expect(alterBuilder['query']).toBe('');
    });

    it('should set tableName correctly', () => {
      // Act
      const alterBuilder = new AlterBuilder(TABLE_NAME);

      // Assert
      expect(alterBuilder['tableName']).toBe(TABLE_NAME);
    });
  });

  describe('foreignKeyAdd Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should add foreign key with basic parameters', async () => {
      // Arrange
      const column = 'user_id';
      const foreignTableName = 'users' as any;
      const foreignColumnName = 'id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.foreignKeyAdd(
        column,
        foreignTableName,
        foreignColumnName,
      );

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName)};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should add foreign key with options', async () => {
      // Arrange
      const column = 'role_id';
      const foreignTableName = 'roles' as any;
      const foreignColumnName = 'id';
      const options: ColumnAttributesWithForeignKey = {
        onDelete: 'CASCADE',
        onUpdate: 'SET NULL',
      };
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.foreignKeyAdd(
        column,
        foreignTableName,
        foreignColumnName,
        options,
      );

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName, options)};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should handle database query errors', async () => {
      // Arrange
      const column = 'user_id';
      const foreignTableName = 'users' as any;
      const foreignColumnName = 'id';
      const error = new Error('Foreign key constraint failed');
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(
        alterBuilder.foreignKeyAdd(column, foreignTableName, foreignColumnName),
      ).rejects.toThrow('Foreign key constraint failed');
    });

    it('should work with different table names', async () => {
      // Arrange
      const tableNames: TableName[] = ['users', 'plans', 'admin_users_roles'];
      const column = 'ref_id';
      const foreignTableName: TableName = 'client_media';
      const foreignColumnName = 'id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      for (const tableName of tableNames) {
        // Act
        const builder = AlterBuilder.table(tableName);
        await builder.foreignKeyAdd(
          column,
          foreignTableName,
          foreignColumnName,
        );

        // Assert
        expect(builder['tableName']).toBe(tableName);
        expect(builder['query']).toBe(
          `ALTER TABLE ${tableName}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName)};`,
        );
      }
    });

    it('should handle multiple foreign key additions on same instance', async () => {
      // Arrange
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      await alterBuilder.foreignKeyAdd('user_id', 'users', 'id');
      const firstQuery = alterBuilder['query'];
      await alterBuilder.foreignKeyAdd('role_id', 'admin_users_roles', 'id');
      const secondQuery = alterBuilder['query'];

      // Assert
      expect(firstQuery).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey('user_id', 'users', 'id')};`,
      );
      expect(secondQuery).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey('role_id', 'admin_users_roles', 'id')};`,
      );
    });
  });

  describe('Reset Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should reset query to empty string', () => {
      // Arrange
      alterBuilder['query'] = 'ALTER TABLE test ADD CONSTRAINT fk_test;';

      // Act
      alterBuilder['reset']();

      // Assert
      expect(alterBuilder['query']).toBe('');
    });

    it('should handle reset when already empty', () => {
      // Arrange
      alterBuilder['query'] = '';

      // Act
      alterBuilder['reset']();

      // Assert
      expect(alterBuilder['query']).toBe('');
    });
  });

  describe('Integration Tests', () => {

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
    });

    it('should work with different database clients', async () => {
      // Test PostgreSQL
      const postgresConfig = {
        ...testConfig,
        client: 'postgres' as const,
      };
      const { initClient } = require('../client');
      await initClient(postgresConfig);
      const postgresBuilder = new AlterBuilder(TABLE_NAME);
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      await postgresBuilder.foreignKeyAdd('user_id', 'users' as any, 'id');
      expect(postgresBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey('user_id', 'users', 'id')};`,
      );

      // Test MySQL
      const mysqlConfig = {
        ...testConfig,
        client: 'mysql' as const,
        port: 3306,
      };
      await initClient(mysqlConfig);
      const mysqlBuilder = new AlterBuilder(TABLE_NAME);
      await mysqlBuilder.foreignKeyAdd('user_id', 'users' as any, 'id');
      expect(mysqlBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey('user_id', 'users', 'id')};`,
      );
    });

    it('should work with static table method and instance methods', async () => {
      // Arrange
      const column = 'user_id';
      const foreignTableName = 'users' as any;
      const foreignColumnName = 'id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const builder = AlterBuilder.table(TABLE_NAME);
      const result = await builder.foreignKeyAdd(
        column,
        foreignTableName,
        foreignColumnName,
      );

      // Assert
      expect(builder['tableName']).toBe(TABLE_NAME);
      expect(builder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName)};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(builder['query']);
      expect(result).toBeDefined();
    });
  });

  describe('dropForeignKey Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should drop foreign key with MySQL syntax', async () => {
      // Arrange
      const constraintName = 'fk_user_id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);
      // Mock MySQL client type
      const { getClientConfig } = require('../client');
      jest.mocked(getClientConfig).mockReturnValue('mysql');

      // Act
      const result = await alterBuilder.dropForeignKey(constraintName);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} DROP FOREIGN KEY ${constraintName};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should drop foreign key with PostgreSQL syntax', async () => {
      // Arrange
      const constraintName = 'fk_user_id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);
      // Mock PostgreSQL client type
      const { getClientConfig } = require('../client');
      jest.mocked(getClientConfig).mockReturnValue('postgres');

      // Act
      const result = await alterBuilder.dropForeignKey(constraintName);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT ${constraintName};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should handle database query errors', async () => {
      // Arrange
      const constraintName = 'fk_user_id';
      const error = new Error('Constraint does not exist');
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(alterBuilder.dropForeignKey(constraintName)).rejects.toThrow(
        'Constraint does not exist',
      );
    });
  });

  describe('dropConstraint Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should drop constraint with universal syntax', async () => {
      // Arrange
      const constraintName = 'fk_user_id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.dropConstraint(constraintName);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT ${constraintName};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should work with different constraint names', async () => {
      // Arrange
      const constraintNames = ['fk_user_id', 'fk_role_id', 'unique_email'];
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      for (const constraintName of constraintNames) {
        // Act
        const builder = AlterBuilder.table(TABLE_NAME);
        await builder.dropConstraint(constraintName);

        // Assert
        expect(builder['query']).toBe(
          `ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT ${constraintName};`,
        );
      }
    });
  });

  describe('addColumn Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should add column with basic definition', async () => {
      // Arrange
      const columnName = 'new_column';
      const columnDefinition = 'VARCHAR(255) NOT NULL';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.addColumn(columnName, columnDefinition);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${columnName} ${columnDefinition};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should handle different column types', async () => {
      // Arrange
      const columns = [
        { name: 'email', definition: 'VARCHAR(255) UNIQUE' },
        { name: 'age', definition: 'INTEGER' },
        { name: 'is_active', definition: 'BOOLEAN DEFAULT true' },
      ];
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      for (const { name, definition } of columns) {
        // Act
        const builder = AlterBuilder.table(TABLE_NAME);
        await builder.addColumn(name, definition);

        // Assert
        expect(builder['query']).toBe(
          `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${name} ${definition};`,
        );
      }
    });

    it('should add column with options (PostgreSQL - no AFTER)', async () => {
      // Arrange
      const columnName = 'email';
      const columnDefinition = 'VARCHAR(255)';
      const options = {
        nullable: false,
        unique: true,
        default: 'test@example.com',
        after: 'id'
      };
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.addColumn(columnName, columnDefinition, options);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${columnName} ${columnDefinition} NOT NULL DEFAULT 'test@example.com' UNIQUE;`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should add column with options (MySQL - includes AFTER)', async () => {
      // Arrange
      const columnName = 'email';
      const columnDefinition = 'VARCHAR(255)';
      const options = {
        nullable: false,
        unique: true,
        default: 'test@example.com',
        after: 'id'
      };
      mockClient.query.mockResolvedValue([{ result: 'success' }]);
      const { getClientConfig } = require('../client');
      jest.mocked(getClientConfig).mockReturnValue('mysql');

      // Act
      const result = await alterBuilder.addColumn(columnName, columnDefinition, options);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${columnName} ${columnDefinition} NOT NULL DEFAULT 'test@example.com' UNIQUE AFTER id;`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });
  });

  describe('dropColumn Method', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should drop column', async () => {
      // Arrange
      const columnName = 'old_column';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await alterBuilder.dropColumn(columnName);

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME} DROP COLUMN ${columnName};`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(alterBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should work with different column names', async () => {
      // Arrange
      const columnNames = ['email', 'phone', 'address'];
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      for (const columnName of columnNames) {
        // Act
        const builder = AlterBuilder.table(TABLE_NAME);
        await builder.dropColumn(columnName);

        // Assert
        expect(builder['query']).toBe(
          `ALTER TABLE ${TABLE_NAME} DROP COLUMN ${columnName};`,
        );
      }
    });
  });

 

  describe('Edge Cases and Error Handling', () => {
    let alterBuilder: AlterBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      alterBuilder = new AlterBuilder(TABLE_NAME);
    });

    it('should handle special characters in column names', async () => {
      // Arrange
      const column = 'user_profile_id';
      const foreignTableName = 'user_profiles' as any;
      const foreignColumnName = 'profile_id';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      await alterBuilder.foreignKeyAdd(
        column,
        foreignTableName,
        foreignColumnName,
      );

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName)};`,
      );
    });

    it('should handle very long column and table names', async () => {
      // Arrange
      const column = 'very_long_column_name_that_exceeds_normal_length';
      const foreignTableName =
        'very_long_table_name_that_exceeds_normal_length' as any;
      const foreignColumnName = 'very_long_foreign_column_name';
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      await alterBuilder.foreignKeyAdd(
        column,
        foreignTableName,
        foreignColumnName,
      );

      // Assert
      expect(alterBuilder['query']).toBe(
        `ALTER TABLE ${TABLE_NAME}\nADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName)};`,
      );
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const column = 'user_id';
      const foreignTableName = 'users' as any;
      const foreignColumnName = 'id';
      const error = new Error('Connection lost');
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(
        alterBuilder.foreignKeyAdd(column, foreignTableName, foreignColumnName),
      ).rejects.toThrow('Connection lost');
    });
  });
});
