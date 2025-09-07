import SchemaBuilder from '../builder/SchemaBuilder';
import {
  DatabaseConfig,
  FullDatabaseConfig,
} from '../types';
import { DEFAULT_DATABASE_SETTINGS } from '../constants';
import { initClient } from '../client';

// Mock the client module
jest.mock('../client', () => {
  let mockClient: any = null;

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

  return {
    __esModule: true,
    get default() {
      return mockClient;
    },
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
          break;
        case 'mysql':
          mockClient = Client(fullConfig);
          break;
      }
      return mockClient;
    }),
    getClient: jest.fn(() => {
      return mockClient;
    }),
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    killClient: jest.fn(async () => {
      mockClient = null;
    }),
  };
});

describe('SchemaBuilder', () => {
  let mockClient: any;
  let testConfig: DatabaseConfig;
  const TABLE_NAME = 'test_table';

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

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
    const { initClient } = require('../client');
    await initClient(testConfig);
    mockClient = require('../client').default;
  });

  afterEach(async () => {
    // Clean up after each test
    const { killClient } = require('../client');
    await killClient();
  });

  describe('Static Methods', () => {
    it('should create instance using static table method', () => {
      // Act
      const schemaBuilder = SchemaBuilder.table(TABLE_NAME);

      // Assert
      expect(schemaBuilder).toBeInstanceOf(SchemaBuilder);
      expect(schemaBuilder['tableName']).toBe(TABLE_NAME);
    });

    it('should create multiple instances with different table names', () => {
      // Act
      const builder1 = SchemaBuilder.table('users');
      const builder2 = SchemaBuilder.table('orders');

      // Assert
      expect(builder1['tableName']).toBe('users');
      expect(builder2['tableName']).toBe('orders');
      expect(builder1).not.toBe(builder2);
    });

    it('should handle special characters in table names', () => {
      // Act
      const specialTableName = 'user_profiles_2024';
      const schemaBuilder = SchemaBuilder.table(specialTableName);

      // Assert
      expect(schemaBuilder['tableName']).toBe(specialTableName);
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with a valid client and call connect', () => {
      // Act & Assert
      expect(() => new SchemaBuilder(TABLE_NAME)).not.toThrow();
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should initialize with empty columns array', () => {
      // Act
      const schemaBuilder = new SchemaBuilder(TABLE_NAME);

      // Assert
      expect(schemaBuilder['columns']).toEqual([]);
    });

    it('should initialize with empty query string', () => {
      // Act
      const schemaBuilder = new SchemaBuilder(TABLE_NAME);

      // Assert
      expect(schemaBuilder['query']).toBe('');
    });

    it('should set tableName correctly', () => {
      // Act
      const schemaBuilder = new SchemaBuilder(TABLE_NAME);

      // Assert
      expect(schemaBuilder['tableName']).toBe(TABLE_NAME);
    });
  });

  describe('Create Method', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should create table with basic columns', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)', 'email VARCHAR(255)'];

      // Act
      const result = schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toBeDefined();
    });

    it('should create table with single column', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY'];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should create table with complex column definitions', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'email VARCHAR(255) UNIQUE',
        'age INTEGER CHECK (age > 0)',
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle empty columns array', () => {
      // Arrange
      const columns: string[] = [];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} ();`
      );
    });

    it('should handle columns with special characters and spaces', () => {
      // Arrange
      const columns = [
        'user_id INTEGER',
        'first_name VARCHAR(100)',
        'last_name VARCHAR(100)',
        'phone_number VARCHAR(20)',
        'is_active BOOLEAN DEFAULT true'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with SQL functions and constraints', () => {
      // Arrange
      const columns = [
        'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'email VARCHAR(255) UNIQUE NOT NULL',
        'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'CONSTRAINT check_email CHECK (email ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\')'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle foreign key constraints', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'user_id INTEGER NOT NULL',
        'order_id INTEGER NOT NULL',
        'FOREIGN KEY (user_id) REFERENCES users(id)',
        'FOREIGN KEY (order_id) REFERENCES orders(id)'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle indexes and unique constraints', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'username VARCHAR(50) UNIQUE',
        'email VARCHAR(255) UNIQUE',
        'status VARCHAR(20)',
        'INDEX idx_status (status)',
        'INDEX idx_username_email (username, email)'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle different data types', () => {
      // Arrange
      const columns = [
        'id BIGINT AUTO_INCREMENT PRIMARY KEY',
        'name VARCHAR(255)',
        'description TEXT',
        'price DECIMAL(10,2)',
        'quantity INTEGER',
        'is_active BOOLEAN',
        'created_at DATETIME',
        'metadata JSON',
        'binary_data BLOB'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle table with no columns (empty table)', () => {
      // Arrange
      const columns: string[] = [];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} ();`
      );
    });

    it('should handle very long column definitions', () => {
      // Arrange
      const longColumn = 'very_long_column_name_that_exceeds_normal_length VARCHAR(1000) NOT NULL DEFAULT \'default_value\' CHECK (very_long_column_name_that_exceeds_normal_length != \'\')';
      const columns = [longColumn];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with quotes and special SQL characters', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) DEFAULT \'Unknown\'',
        'description TEXT DEFAULT \'No description provided\'',
        'CONSTRAINT check_name CHECK (name != \'\' AND name IS NOT NULL)'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });
  });

  describe('buildCreateQuery Method', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should build basic CREATE TABLE query', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should build query with single column', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY'];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should build query with empty columns', () => {
      // Arrange
      const columns: string[] = [];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} ();`
      );
    });

    it('should build query with complex column definitions', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'email VARCHAR(255) UNIQUE',
        'age INTEGER CHECK (age > 0)',
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      ];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with commas in definitions', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL, UNIQUE',
        'email VARCHAR(255) UNIQUE, NOT NULL'
      ];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle very long column list', () => {
      // Arrange
      const columns = Array.from({ length: 10 }, (_, i) => `col${i + 1} VARCHAR(255)`);
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with special characters', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'user_name VARCHAR(255)',
        'email_address VARCHAR(255)',
        'phone_number VARCHAR(20)',
        'is_active BOOLEAN'
      ];
      schemaBuilder['columns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });
  });

  describe('Reset Method', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should reset columns to empty array', () => {
      // Arrange
      schemaBuilder['columns'] = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      schemaBuilder['query'] = 'CREATE TABLE test (id SERIAL PRIMARY KEY,name VARCHAR(255))';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['columns']).toEqual([]);
    });

    it('should reset query to empty string', () => {
      // Arrange
      schemaBuilder['columns'] = ['id SERIAL PRIMARY KEY'];
      schemaBuilder['query'] = 'CREATE TABLE test (id SERIAL PRIMARY KEY)';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['query']).toBe('');
    });

    it('should reset both columns and query', () => {
      // Arrange
      schemaBuilder['columns'] = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)', 'email VARCHAR(255)'];
      schemaBuilder['query'] = 'CREATE TABLE test (id SERIAL PRIMARY KEY,name VARCHAR(255),email VARCHAR(255))';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['columns']).toEqual([]);
      expect(schemaBuilder['query']).toBe('');
    });

    it('should handle reset when already empty', () => {
      // Arrange
      schemaBuilder['columns'] = [];
      schemaBuilder['query'] = '';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['columns']).toEqual([]);
      expect(schemaBuilder['query']).toBe('');
    });
  });

  describe('Integration Tests', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should create table and execute query successfully', async () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      mockClient.query.mockResolvedValue([{ result: 'success' }]);

      // Act
      const result = await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should handle database query errors', async () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const error = new Error('Table already exists');
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(schemaBuilder.create(columns)).rejects.toThrow('Table already exists');
    });

    it('should work with different table names', () => {
      // Arrange
      const tableNames = ['users', 'orders', 'products', 'categories'];
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];

      tableNames.forEach(tableName => {
        // Act
        const builder = SchemaBuilder.table(tableName);
        builder.create(columns);

        // Assert
        expect(builder['tableName']).toBe(tableName);
        expect(builder['query']).toBe(
          `CREATE TABLE ${tableName} (${columns.join(',')});`
        );
      });
    });

    it('should handle multiple create operations on same instance', () => {
      // Arrange
      const columns1 = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const columns2 = ['id SERIAL PRIMARY KEY', 'email VARCHAR(255)', 'age INTEGER'];

      // Act
      schemaBuilder.create(columns1);
      const firstQuery = schemaBuilder['query'];
      schemaBuilder.create(columns2);
      const secondQuery = schemaBuilder['query'];

      // Assert
      expect(firstQuery).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns1.join(',')});`
      );
      expect(secondQuery).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns2.join(',')});`
      );
      expect(schemaBuilder['columns']).toEqual(columns2);
    });

    it('should work with different database clients', async () => {
      // Test PostgreSQL
      const postgresConfig = {
        ...testConfig,
        client: 'postgres' as const,
      };
      const { initClient } = require('../client');
      await initClient(postgresConfig);
      const postgresBuilder = new SchemaBuilder(TABLE_NAME);
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      postgresBuilder.create(columns);
      expect(postgresBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );

      // Test MySQL
      const mysqlConfig = {
        ...testConfig,
        client: 'mysql' as const,
        port: 3306,
      };
      await initClient(mysqlConfig);
      const mysqlBuilder = new SchemaBuilder(TABLE_NAME);
      mysqlBuilder.create(columns);
      expect(mysqlBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should handle null and undefined values in columns array', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', null as any, 'name VARCHAR(255)', undefined as any];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle empty string columns', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', '', 'name VARCHAR(255)', '   '];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with only whitespace', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', '   ', '\t', '\n', 'name VARCHAR(255)'];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle very large number of columns', () => {
      // Arrange
      const columns = Array.from({ length: 100 }, (_, i) => `col${i + 1} VARCHAR(255)`);

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with special SQL keywords', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'select VARCHAR(255)',
        'from VARCHAR(255)',
        'where VARCHAR(255)',
        'order VARCHAR(255)',
        'group VARCHAR(255)'
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });

    it('should handle columns with very long definitions', () => {
      // Arrange
      const longDefinition = 'very_long_column_name_that_exceeds_normal_length_and_contains_many_characters VARCHAR(1000) NOT NULL DEFAULT \'default_value_that_is_also_very_long\' CHECK (very_long_column_name_that_exceeds_normal_length_and_contains_many_characters != \'\' AND very_long_column_name_that_exceeds_normal_length_and_contains_many_characters IS NOT NULL)';
      const columns = [longDefinition];

      // Act
      schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });
  });

  describe('Method Chaining and State Management', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    it('should maintain state between multiple create calls', () => {
      // Arrange
      const columns1 = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const columns2 = ['id SERIAL PRIMARY KEY', 'email VARCHAR(255)', 'age INTEGER'];

      // Act
      schemaBuilder.create(columns1);
      const stateAfterFirst = {
        columns: [...schemaBuilder['columns']],
        query: schemaBuilder['query']
      };
      
      schemaBuilder.create(columns2);
      const stateAfterSecond = {
        columns: [...schemaBuilder['columns']],
        query: schemaBuilder['query']
      };

      // Assert
      expect(stateAfterFirst.columns).toEqual(columns1);
      expect(stateAfterFirst.query).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns1.join(',')});`
      );
      expect(stateAfterSecond.columns).toEqual(columns2);
      expect(stateAfterSecond.query).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns2.join(',')});`
      );
    });

    it('should handle reset between operations', () => {
      // Arrange
      const columns1 = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const columns2 = ['id SERIAL PRIMARY KEY', 'email VARCHAR(255)'];

      // Act
      schemaBuilder.create(columns1);
      schemaBuilder['reset']();
      schemaBuilder.create(columns2);

      // Assert
      expect(schemaBuilder['columns']).toEqual(columns2);
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns2.join(',')});`
      );
    });

    it('should work with static factory method and instance methods', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)', 'email VARCHAR(255)'];

      // Act
      const builder = SchemaBuilder.table(TABLE_NAME);
      builder.create(columns);

      // Assert
      expect(builder['tableName']).toBe(TABLE_NAME);
      expect(builder['columns']).toEqual(columns);
      expect(builder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (${columns.join(',')});`
      );
    });
  });
});
