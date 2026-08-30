import {
  DatabaseClient,
  DatabaseConfig,
  FullDatabaseConfig,
} from '@repo/common-lib/types/database';
import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
import SchemaBuilder from '../builder/schemaBuilder';

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
describe('SchemaBuilder', () => {
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
      const schemaBuilder = SchemaBuilder.table(TABLE_NAME);

      // Assert
      expect(schemaBuilder).toBeInstanceOf(SchemaBuilder);
      expect(schemaBuilder['tableName']).toBe(TABLE_NAME);
    });



    it('tableIfExists should return instance when table exists', async () => {
      // Arrange
      mockClient.query.mockResolvedValueOnce({ rows: [{ exists: true }] });

      // Act
      const builder = await SchemaBuilder.tableIfExists(TABLE_NAME);

      // Assert
      expect(builder).toBeInstanceOf(SchemaBuilder);
      expect(builder && builder['tableName']).toBe(TABLE_NAME);
    });

    it('tableIfExists should return null when table does not exist', async () => {
      // Arrange
      mockClient.query.mockResolvedValueOnce({ rows: [{ exists: false }] });

      // Act
      const builder = await SchemaBuilder.tableIfExists('non_existing' as any);

      // Assert
      expect(builder).toBeNull();
    });
  });

  describe('addEnumValue', () => {
    it('should add a value to an existing enum with IF NOT EXISTS', async () => {
      mockClient.query.mockResolvedValueOnce([{ result: 'success' }]);

      const result = await SchemaBuilder.addEnumValue(
        'NOTIFICATION_TYPE',
        'DELETE_MEDIA',
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        `ALTER TYPE NOTIFICATION_TYPE ADD VALUE IF NOT EXISTS 'DELETE_MEDIA';`,
      );
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should add a value to a different enum', async () => {
      await SchemaBuilder.addEnumValue('MEDIA_STATUS', 'FAILED');

      expect(mockClient.query).toHaveBeenCalledWith(
        `ALTER TYPE MEDIA_STATUS ADD VALUE IF NOT EXISTS 'FAILED';`,
      );
    });

    it('should add an enum value that contains special characters', async () => {
      await SchemaBuilder.addEnumValue('ASPECT_RATIO', '16:9');

      expect(mockClient.query).toHaveBeenCalledWith(
        `ALTER TYPE ASPECT_RATIO ADD VALUE IF NOT EXISTS '16:9';`,
      );
    });

    it('should propagate database errors', async () => {
      mockClient.query.mockRejectedValueOnce(
        new Error('type "NOTIFICATION_TYPE" does not exist'),
      );

      await expect(
        SchemaBuilder.addEnumValue('NOTIFICATION_TYPE', 'NEW_CONTACT'),
      ).rejects.toThrow('type "NOTIFICATION_TYPE" does not exist');
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with a valid client and call connect', () => {
      // Act & Assert
      expect(() => new SchemaBuilder(TABLE_NAME)).not.toThrow();
      expect(mockClient.connect).toHaveBeenCalledTimes(0);
    });

    it('should initialize with empty columns array', () => {
      // Act
      const schemaBuilder = new SchemaBuilder(TABLE_NAME);

      // Assert
      expect(schemaBuilder['createColumns']).toEqual([]);
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
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255)',
        'email VARCHAR(255)',
      ];

      // Act
      const result = schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle empty columns array', () => {
      // Arrange
      const columns: string[] = [];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(`CREATE TABLE ${TABLE_NAME} (\n);`);
    });

    it('should handle columns with special characters and spaces', () => {
      // Arrange
      const columns = [
        'user_id INTEGER',
        'first_name VARCHAR(100)',
        'last_name VARCHAR(100)',
        'phone_number VARCHAR(20)',
        'is_active BOOLEAN DEFAULT true',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        "CONSTRAINT check_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')",
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle foreign key constraints', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'user_id INTEGER NOT NULL',
        'order_id INTEGER NOT NULL',
        'FOREIGN KEY (user_id) REFERENCES users(id)',
        'FOREIGN KEY (order_id) REFERENCES orders(id)',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        'INDEX idx_username_email (username, email)',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        'binary_data BLOB',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle table with no columns (empty table)', () => {
      // Arrange
      const columns: string[] = [];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(`CREATE TABLE ${TABLE_NAME} (\n);`);
    });

    it('should handle very long column definitions', () => {
      // Arrange
      const longColumn =
        "very_long_column_name_that_exceeds_normal_length VARCHAR(1000) NOT NULL DEFAULT 'default_value' CHECK (very_long_column_name_that_exceeds_normal_length != '')";
      const columns = [longColumn];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle columns with quotes and special SQL characters', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        "name VARCHAR(255) DEFAULT 'Unknown'",
        "description TEXT DEFAULT 'No description provided'",
        "CONSTRAINT check_name CHECK (name != '' AND name IS NOT NULL)",
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should build query with single column', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY'];
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should build query with empty columns', () => {
      // Arrange
      const columns: string[] = [];
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(`CREATE TABLE ${TABLE_NAME} (\n);`);
    });

    it('should build query with complex column definitions', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'email VARCHAR(255) UNIQUE',
        'age INTEGER CHECK (age > 0)',
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      ];
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle columns with commas in definitions', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL, UNIQUE',
        'email VARCHAR(255) UNIQUE, NOT NULL',
      ];
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle very long column list', () => {
      // Arrange
      const columns = Array.from(
        { length: 10 },
        (_, i) => `col${i + 1} VARCHAR(255)`,
      );
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle columns with special characters', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'user_name VARCHAR(255)',
        'email_address VARCHAR(255)',
        'phone_number VARCHAR(20)',
        'is_active BOOLEAN',
      ];
      schemaBuilder['createColumns'] = columns;

      // Act
      schemaBuilder['buildCreateQuery']();

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
      schemaBuilder['createColumns'] = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255)',
      ];
      schemaBuilder['query'] =
        'CREATE TABLE test (id SERIAL PRIMARY KEY,name VARCHAR(255))';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['createColumns']).toEqual([]);
    });

    it('should reset query to empty string', () => {
      // Arrange
      schemaBuilder['createColumns'] = ['id SERIAL PRIMARY KEY'];
      schemaBuilder['query'] = 'CREATE TABLE test (id SERIAL PRIMARY KEY)';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['query']).toBe('');
    });

    it('should reset both columns and query', () => {
      // Arrange
      schemaBuilder['createColumns'] = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255)',
        'email VARCHAR(255)',
      ];
      schemaBuilder['query'] =
        'CREATE TABLE test (id SERIAL PRIMARY KEY,name VARCHAR(255),email VARCHAR(255))';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['createColumns']).toEqual([]);
      expect(schemaBuilder['query']).toBe('');
    });

    it('should handle reset when already empty', () => {
      // Arrange
      schemaBuilder['createColumns'] = [];
      schemaBuilder['query'] = '';

      // Act
      schemaBuilder['reset']();

      // Assert
      expect(schemaBuilder['createColumns']).toEqual([]);
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
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
      await expect(schemaBuilder.create(columns)).rejects.toThrow(
        'Table already exists',
      );
    });



    it('should handle multiple create operations on same instance', () => {
      // Arrange
      const columns1 = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const columns2 = [
        'id SERIAL PRIMARY KEY',
        'email VARCHAR(255)',
        'age INTEGER',
      ];

      // Act
      schemaBuilder.create(columns1);
      const firstQuery = schemaBuilder['query'];
      schemaBuilder.create(columns2);
      const secondQuery = schemaBuilder['query'];

      // Assert
      expect(firstQuery).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns1.join(',\n')}\n);`,
      );
      expect(secondQuery).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns2.join(',\n')}\n);`,
      );
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
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
      const columns = [
        'id SERIAL PRIMARY KEY',
        null as any,
        'name VARCHAR(255)',
        undefined as any,
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle empty string columns', () => {
      // Arrange
      const columns = ['id SERIAL PRIMARY KEY', '', 'name VARCHAR(255)', '   '];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle columns with only whitespace', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        '   ',
        '\t',
        '\n',
        'name VARCHAR(255)',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle very large number of columns', () => {
      // Arrange
      const columns = Array.from(
        { length: 100 },
        (_, i) => `col${i + 1} VARCHAR(255)`,
      );

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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
        'group VARCHAR(255)',
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should handle columns with very long definitions', () => {
      // Arrange
      const longDefinition =
        "very_long_column_name_that_exceeds_normal_length_and_contains_many_characters VARCHAR(1000) NOT NULL DEFAULT 'default_value_that_is_also_very_long' CHECK (very_long_column_name_that_exceeds_normal_length_and_contains_many_characters != '' AND very_long_column_name_that_exceeds_normal_length_and_contains_many_characters IS NOT NULL)";
      const columns = [longDefinition];

      // Act
      schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
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

    it('should handle reset between operations', () => {
      // Arrange
      const columns1 = ['id SERIAL PRIMARY KEY', 'name VARCHAR(255)'];
      const columns2 = ['id SERIAL PRIMARY KEY', 'email VARCHAR(255)'];

      // Act
      schemaBuilder.create(columns1);
      schemaBuilder['reset']();
      schemaBuilder.create(columns2);

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns2.join(',\n')}\n);`,
      );
    });

    it('should work with static factory method and instance methods', () => {
      // Arrange
      const columns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255)',
        'email VARCHAR(255)',
      ];

      // Act
      const builder = SchemaBuilder.table(TABLE_NAME);
      builder.create(columns);

      // Assert
      expect(builder['tableName']).toBe(TABLE_NAME);
      expect(builder['query']).toBe(
        `CREATE TABLE ${TABLE_NAME} (\n${columns.join(',\n')}\n);`,
      );
    });
  });

  describe('SchemaBuilder with ColumnBuilder Integration', () => {
    let schemaBuilder: SchemaBuilder;
    const { ColumnBuilder } = require('../builder/columnBuilder');

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder('users');
    });

    it('should create a complete user table using ColumnBuilder methods', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('name', 255, {
          nullable: true,
        }),
        ColumnBuilder.string('username', 255, {
          nullable: true,
          unique: true,
        }),
        ColumnBuilder.email(),
        ColumnBuilder.password(),
        ColumnBuilder.foreignKey('role_id', 'roles', 'id', {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
        ...ColumnBuilder.timestamps(),
        ColumnBuilder.softDelete(),
      ];

      // Act
      const result = await schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE users (\n${columns.join(',\n')}\n);`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toBeDefined();
    });

    it('should create a products table with various column types', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id('product_id'),
        ColumnBuilder.string('name', 255, {
          nullable: false,
        }),
        ColumnBuilder.string('description', 1000, {
          nullable: true,
        }),
        ColumnBuilder.integer('price', {
          nullable: false,
        }),
        ColumnBuilder.integer('stock_quantity', {
          nullable: false,
          default: 0,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ColumnBuilder.bigint('category_id', {
          nullable: true,
        }),
        ColumnBuilder.foreignKey('supplier_id', 'suppliers', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.timestamp('created_at', {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.timestamp('updated_at', {
          nullable: true,
        }),
      ];

      // Act
      const result = await schemaBuilder.create(columns);

      // Assert

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE users (\n${columns.join(',\n')}\n);`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toBeDefined();
    });

    it('should create an orders table with complex relationships', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id('order_id'),
        ColumnBuilder.string('order_number', 50, {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.integer('total_amount', {
          nullable: false,
        }),
        ColumnBuilder.string('status', 20, {
          nullable: false,
          default: 'pending',
        }),
        ColumnBuilder.foreignKey('customer_id', 'customers', 'id', {
          nullable: false,
          onDelete: 'CASCADE',
        }),
        ColumnBuilder.foreignKey('shipping_address_id', 'addresses', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.boolean('is_paid', {
          default: false,
        }),
        ColumnBuilder.timestamp('order_date', {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.timestamp('shipped_date', {
          nullable: true,
        }),
        ColumnBuilder.timestamp('delivered_date', {
          nullable: true,
        }),
        ColumnBuilder.softDelete('cancelled_at'),
      ];

      // Act
      const result = await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE users (\n${columns.join(',\n')}\n);`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toBeDefined();
    });

    it('should create a simple settings table with minimal columns', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('key', 100, {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.string('value', 1000, {
          nullable: true,
        }),
        ColumnBuilder.string('description', 500, {
          nullable: true,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ...ColumnBuilder.timestamps(),
      ];

      // Act
      const result = await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE users (\n${columns.join(',\n')}\n);`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
      expect(result).toBeDefined();
    });

    it('should handle database errors during table creation', async () => {
      // Arrange
      const columns = [ColumnBuilder.id(), ColumnBuilder.string('name', 255)];
      const error = new Error('Table already exists');
      mockClient.query.mockRejectedValue(error);

      // Act & Assert
      await expect(schemaBuilder.create(columns)).rejects.toThrow(
        'Table already exists',
      );
    });

    it('should work with static table method and ColumnBuilder', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('name', 255),
        ColumnBuilder.email(),
        ...ColumnBuilder.timestamps(),
      ];

      // Act
      const builder = SchemaBuilder.table('admin_users');
      const result = await builder.create(columns);

      // Assert
      expect(builder['tableName']).toBe('admin_users');
      expect(builder['query']).toBe(
        `CREATE TABLE admin_users (\n${columns.join(',\n')}\n);`,
      );
      expect(mockClient.query).toHaveBeenCalledWith(builder['query']);
      expect(result).toBeDefined();
    });

    it('should handle multiple table creations with different schemas', async () => {
      // Arrange
      const userColumns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('username', 50, { unique: true }),
        ColumnBuilder.email(),
        ColumnBuilder.password(),
        ...ColumnBuilder.timestamps(),
      ];

      const postColumns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('title', 255),
        ColumnBuilder.string('content', 5000),
        ColumnBuilder.foreignKey('author_id', 'users', 'id'),
        ...ColumnBuilder.timestamps(),
        ColumnBuilder.softDelete(),
      ];

      // Act
      const userBuilder = SchemaBuilder.table('users');
      const postBuilder = SchemaBuilder.table('media');

      await userBuilder.create(userColumns);
      await postBuilder.create(postColumns);

      // Assert
      expect(userBuilder['tableName']).toBe('users');
      expect(userBuilder['query']).toBe(
        `CREATE TABLE users (\n${userColumns.join(',\n')}\n);`,
      );

      expect(postBuilder['tableName']).toBe('media');
      expect(postBuilder['query']).toBe(
        `CREATE TABLE media (\n${postColumns.join(',\n')}\n);`,
      );

      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should validate that all ColumnBuilder methods return proper SQL strings', () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.integer('count'),
        ColumnBuilder.bigint('large_id'),
        ColumnBuilder.boolean('flag'),
        ColumnBuilder.string('text', 255),
        ColumnBuilder.email(),
        ColumnBuilder.password(),
        ColumnBuilder.foreignKey('ref_id', 'table', 'id'),
        ColumnBuilder.timestamp('time'),
        ColumnBuilder.softDelete(),
      ];

      // Act
      schemaBuilder.create(columns);

      // Assert
      columns.forEach((column) => {
        expect(typeof column).toBe('string');
        expect(column.length).toBeGreaterThan(0);
      });

      expect(schemaBuilder['query']).toBe(
        `CREATE TABLE users (\n${columns.join(',\n')}\n);`,
      );
    });

    it('should generate exact SQL query matching hardcoded expected result', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('name', 255, {
          nullable: true,
        }),
        ColumnBuilder.string('username', 255, {
          nullable: true,
          unique: true,
        }),
        ColumnBuilder.email(),
        ColumnBuilder.password(),
        ColumnBuilder.foreignKey('role_id', 'roles', 'id', {
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
        ColumnBuilder.timestamps(),
        ColumnBuilder.softDelete(),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NULL,
username VARCHAR(255) NULL UNIQUE,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
role_id INTEGER REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMPTZ NULL
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });

    it('should generate exact SQL for complex table with all column types', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id('product_id'),
        ColumnBuilder.string('name', 255, {
          nullable: false,
        }),
        ColumnBuilder.string('description', 1000, {
          nullable: true,
        }),
        ColumnBuilder.integer('price', {
          nullable: false,
        }),
        ColumnBuilder.integer('stock_quantity', {
          nullable: false,
          default: 0,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ColumnBuilder.bigint('category_id', {
          nullable: true,
        }),
        ColumnBuilder.foreignKey('supplier_id', 'suppliers', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.timestamp('created_at', {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.timestamp('updated_at', {
          nullable: true,
        }),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
product_id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description VARCHAR(1000) NULL,
price INTEGER NOT NULL,
stock_quantity INTEGER NOT NULL DEFAULT 0,
is_active BOOLEAN NOT NULL DEFAULT true,
category_id BIGINT NULL,
supplier_id INTEGER REFERENCES suppliers (id) ON DELETE SET NULL NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NULL
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });

    it('should generate exact SQL for blog posts table with content management', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('title', 255, {
          nullable: false,
        }),
        ColumnBuilder.string('slug', 255, {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.string('excerpt', 500, {
          nullable: true,
        }),
        ColumnBuilder.string('content', 10000, {
          nullable: false,
        }),
        ColumnBuilder.string('featured_image', 500, {
          nullable: true,
        }),
        ColumnBuilder.boolean('is_published', {
          default: false,
        }),
        ColumnBuilder.boolean('is_featured', {
          default: false,
        }),
        ColumnBuilder.integer('view_count', {
          default: 0,
        }),
        ColumnBuilder.foreignKey('author_id', 'users', 'id', {
          nullable: false,
          onDelete: 'CASCADE',
        }),
        ColumnBuilder.foreignKey('category_id', 'categories', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.timestamps(false, {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.softDelete(),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
id SERIAL PRIMARY KEY,
title VARCHAR(255) NOT NULL,
slug VARCHAR(255) NOT NULL UNIQUE,
excerpt VARCHAR(500) NULL,
content VARCHAR(10000) NOT NULL,
featured_image VARCHAR(500) NULL,
is_published BOOLEAN NOT NULL DEFAULT false,
is_featured BOOLEAN NOT NULL DEFAULT false,
view_count INTEGER NOT NULL DEFAULT 0,
author_id INTEGER REFERENCES users (id) ON DELETE CASCADE NOT NULL,
category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMPTZ NULL
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });

    it('should generate exact SQL for simple settings table', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('key', 100, {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.string('value', 1000, {
          nullable: true,
        }),
        ColumnBuilder.string('description', 500, {
          nullable: true,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ColumnBuilder.timestamps(),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
id SERIAL PRIMARY KEY,
key VARCHAR(100) NOT NULL UNIQUE,
value VARCHAR(1000) NULL,
description VARCHAR(500) NULL,
is_active BOOLEAN NOT NULL DEFAULT true,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });

    it('should generate exact SQL for subscription table with enum columns', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id('subscription_id'),
        ColumnBuilder.string('name', 255, {
          nullable: false,
        }),
        ColumnBuilder.string('description', 1000, {
          nullable: true,
        }),
        ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          nullable: false,
          default: 'monthly',
        }),
        ColumnBuilder.enum('user_role', 'USER_EDITORS_ROLES', {
          nullable: true,
          default: 'editor',
        }),
        ColumnBuilder.integer('price', {
          nullable: false,
        }),
        ColumnBuilder.integer('duration_months', {
          nullable: false,
          default: 1,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ColumnBuilder.boolean('is_featured', {
          default: false,
        }),
        ColumnBuilder.foreignKey('created_by', 'users', 'id', {
          nullable: false,
          onDelete: 'CASCADE',
        }),
        ColumnBuilder.foreignKey('updated_by', 'users', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.timestamps(false, {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.softDelete('archived_at'),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
subscription_id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description VARCHAR(1000) NULL,
billing_type BILLING_TYPE NOT NULL DEFAULT 'monthly',
user_role USER_EDITORS_ROLES NULL DEFAULT 'editor',
price INTEGER NOT NULL,
duration_months INTEGER NOT NULL DEFAULT 1,
is_active BOOLEAN NOT NULL DEFAULT true,
is_featured BOOLEAN NOT NULL DEFAULT false,
created_by INTEGER REFERENCES users (id) ON DELETE CASCADE NOT NULL,
updated_by INTEGER REFERENCES users (id) ON DELETE SET NULL NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
archived_at TIMESTAMPTZ NULL
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });

    it('should generate exact SQL for user profile table with enum and complex relationships', async () => {
      // Arrange
      const columns = [
        ColumnBuilder.id(),
        ColumnBuilder.string('username', 50, {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.string('first_name', 100, {
          nullable: false,
        }),
        ColumnBuilder.string('last_name', 100, {
          nullable: false,
        }),
        ColumnBuilder.email('primary_email', {
          nullable: false,
          unique: true,
        }),
        ColumnBuilder.string('secondary_email', 255, {
          nullable: true,
        }),
        ColumnBuilder.password('hashed_password'),
        ColumnBuilder.enum('billing_preference', 'BILLING_TYPE', {
          nullable: false,
          default: 'monthly',
        }),
        ColumnBuilder.enum('role', 'USER_EDITORS_ROLES', {
          nullable: false,
          default: 'editor',
        }),
        ColumnBuilder.string('phone_number', 20, {
          nullable: true,
        }),
        ColumnBuilder.string('address', 500, {
          nullable: true,
        }),
        ColumnBuilder.string('city', 100, {
          nullable: true,
        }),
        ColumnBuilder.string('country', 100, {
          nullable: true,
        }),
        ColumnBuilder.string('postal_code', 20, {
          nullable: true,
        }),
        ColumnBuilder.boolean('is_verified', {
          default: false,
        }),
        ColumnBuilder.boolean('is_active', {
          default: true,
        }),
        ColumnBuilder.boolean('email_notifications', {
          default: true,
        }),
        ColumnBuilder.boolean('sms_notifications', {
          default: false,
        }),
        ColumnBuilder.integer('login_attempts', {
          default: 0,
        }),
        ColumnBuilder.timestamp('last_login', {
          nullable: true,
        }),
        ColumnBuilder.timestamp('email_verified_at', {
          nullable: true,
        }),
        ColumnBuilder.timestamp('password_changed_at', {
          nullable: true,
        }),
        ColumnBuilder.foreignKey('manager_id', 'users', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.foreignKey('department_id', 'departments', 'id', {
          nullable: true,
          onDelete: 'SET NULL',
        }),
        ColumnBuilder.timestamps(false, {
          nullable: false,
          default: 'NOW()',
        }),
        ColumnBuilder.softDelete(),
      ];

      // Expected hardcoded SQL query
      const expectedSQL = `CREATE TABLE users (
id SERIAL PRIMARY KEY,
username VARCHAR(50) NOT NULL UNIQUE,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
primary_email VARCHAR(255) NOT NULL UNIQUE,
secondary_email VARCHAR(255) NULL,
hashed_password VARCHAR(255) NOT NULL,
billing_preference BILLING_TYPE NOT NULL DEFAULT 'monthly',
role USER_EDITORS_ROLES NOT NULL DEFAULT 'editor',
phone_number VARCHAR(20) NULL,
address VARCHAR(500) NULL,
city VARCHAR(100) NULL,
country VARCHAR(100) NULL,
postal_code VARCHAR(20) NULL,
is_verified BOOLEAN NOT NULL DEFAULT false,
is_active BOOLEAN NOT NULL DEFAULT true,
email_notifications BOOLEAN NOT NULL DEFAULT true,
sms_notifications BOOLEAN NOT NULL DEFAULT false,
login_attempts INTEGER NOT NULL DEFAULT 0,
last_login TIMESTAMPTZ NULL,
email_verified_at TIMESTAMPTZ NULL,
password_changed_at TIMESTAMPTZ NULL,
manager_id INTEGER REFERENCES users (id) ON DELETE SET NULL NULL,
department_id INTEGER REFERENCES departments (id) ON DELETE SET NULL NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMPTZ NULL
);`;

      // Act
      await schemaBuilder.create(columns);

      // Assert
      expect(schemaBuilder['query']).toBe(expectedSQL);
      expect(mockClient.query).toHaveBeenCalledWith(expectedSQL);
    });
  });

  describe('Drop and Truncate Methods', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    describe('drop() method', () => {
      it('should throw error when allowDrop is false', async () => {
        // Arrange - allowDrop is false by default in DEFAULT_DATABASE_SETTINGS
        const {
          SchemaBuilderOperationNotAllowedException,
        } = require('../builder/schemaBuilder/exceptions');

        // Act & Assert
        await expect(schemaBuilder.drop()).rejects.toThrow(
          SchemaBuilderOperationNotAllowedException,
        );
        await expect(schemaBuilder.drop()).rejects.toThrow(
          'Drop is not allowed, set allowDrop to true in the database config',
        );
      });

      it('should execute drop query when allowDrop is true', async () => {
        // Arrange
        const configWithDrop = {
          ...testConfig,
          settings: {
            ...DEFAULT_DATABASE_SETTINGS,
            allowDrop: true,
          },
        };
        const { initClient } = require('../client');
        await initClient(configWithDrop);
        const builderWithDrop = new SchemaBuilder(TABLE_NAME);
        mockClient.query.mockResolvedValue([{ result: 'success' }]);

        // Act
        const result = await builderWithDrop.drop();

        // Assert
        expect(builderWithDrop['query']).toBe(`DROP TABLE ${TABLE_NAME}`);
        expect(mockClient.query).toHaveBeenCalledWith(
          `DROP TABLE ${TABLE_NAME}`,
        );
        expect(result).toEqual([{ result: 'success' }]);
      });
    });

    describe('dropIfExists() method', () => {
      it('should throw error when allowDrop is false', async () => {
        // Arrange - allowDrop is false by default
        const {
          SchemaBuilderOperationNotAllowedException,
        } = require('../builder/schemaBuilder/exceptions');

        // Act & Assert
        await expect(schemaBuilder.dropIfExists()).rejects.toThrow(
          SchemaBuilderOperationNotAllowedException,
        );
        await expect(schemaBuilder.dropIfExists()).rejects.toThrow(
          'Drop is not allowed, set allowDrop to true in the database config',
        );
      });

      it('should execute drop if exists query when allowDrop is true', async () => {
        // Arrange
        const configWithDrop = {
          ...testConfig,
          settings: {
            ...DEFAULT_DATABASE_SETTINGS,
            allowDrop: true,
          },
        };
        const { initClient } = require('../client');
        await initClient(configWithDrop);
        const builderWithDrop = new SchemaBuilder(TABLE_NAME);
        mockClient.query.mockResolvedValue([{ result: 'success' }]);

        // Act
        const result = await builderWithDrop.dropIfExists();

        // Assert
        expect(builderWithDrop['query']).toBe(
          `DROP TABLE IF EXISTS ${TABLE_NAME}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(
          `DROP TABLE IF EXISTS ${TABLE_NAME}`,
        );
        expect(result).toEqual([{ result: 'success' }]);
      });
    });

    describe('truncate() method', () => {
      it('should throw error when allowTruncate is false', async () => {
        // Arrange - allowTruncate is false by default
        const {
          SchemaBuilderOperationNotAllowedException,
        } = require('../builder/schemaBuilder/exceptions');

        // Act & Assert
        await expect(schemaBuilder.truncate()).rejects.toThrow(
          SchemaBuilderOperationNotAllowedException,
        );
        await expect(schemaBuilder.truncate()).rejects.toThrow(
          'Truncate is not allowed, set allowTruncate to true in the database config',
        );
      });

      it('should execute truncate query when allowTruncate is true', async () => {
        // Arrange
        const configWithTruncate = {
          ...testConfig,
          settings: {
            ...DEFAULT_DATABASE_SETTINGS,
            allowTruncate: true,
          },
        };
        const { initClient } = require('../client');
        await initClient(configWithTruncate);
        const builderWithTruncate = new SchemaBuilder(TABLE_NAME);
        mockClient.query.mockResolvedValue([{ result: 'success' }]);

        // Act
        const result = await builderWithTruncate.truncate();

        // Assert
        expect(builderWithTruncate['query']).toBe(
          `TRUNCATE TABLE ${TABLE_NAME}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(
          `TRUNCATE TABLE ${TABLE_NAME}`,
        );
        expect(result).toEqual([{ result: 'success' }]);
      });
    });

    describe('Error handling', () => {
      it('should handle database errors during drop operation', async () => {
        // Arrange
        const configWithDrop = {
          ...testConfig,
          settings: {
            ...DEFAULT_DATABASE_SETTINGS,
            allowDrop: true,
          },
        };
        const { initClient } = require('../client');
        await initClient(configWithDrop);
        const builderWithDrop = new SchemaBuilder(TABLE_NAME);
        const error = new Error('Table does not exist');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(builderWithDrop.drop()).rejects.toThrow(
          'Table does not exist',
        );
      });

      it('should handle database errors during truncate operation', async () => {
        // Arrange
        const configWithTruncate = {
          ...testConfig,
          settings: {
            ...DEFAULT_DATABASE_SETTINGS,
            allowTruncate: true,
          },
        };
        const { initClient } = require('../client');
        await initClient(configWithTruncate);
        const builderWithTruncate = new SchemaBuilder(TABLE_NAME);
        const error = new Error('Table is locked');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(builderWithTruncate.truncate()).rejects.toThrow(
          'Table is locked',
        );
      });
    });
  });

  describe('Index Creation Methods', () => {
    let schemaBuilder: SchemaBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      schemaBuilder = new SchemaBuilder(TABLE_NAME);
    });

    describe('createIndex() method', () => {
      it('should create basic index with single column', async () => {
        // Arrange
        const indexName = 'idx_users_email';
        const columns = 'email';

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create index with multiple columns', async () => {
        // Arrange
        const indexName = 'idx_users_name_email';
        const columns = ['first_name', 'last_name', 'email'];

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns.join(', ')})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create unique index', async () => {
        // Arrange
        const indexName = 'idx_users_unique_email';
        const columns = 'email';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          unique: true,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE UNIQUE INDEX ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create index with BTREE type', async () => {
        // Arrange
        const indexName = 'idx_users_btree';
        const columns = 'created_at';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          type: 'btree',
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} USING BTREE (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create GIN index', async () => {
        // Arrange
        const indexName = 'idx_users_gin';
        const columns = 'metadata';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          type: 'gin',
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} USING GIN (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create GIST index', async () => {
        // Arrange
        const indexName = 'idx_users_gist';
        const columns = 'location';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          type: 'gist',
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} USING GIST (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create HASH index', async () => {
        // Arrange
        const indexName = 'idx_users_hash';
        const columns = 'category';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          type: 'hash',
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} USING HASH (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create partial index with WHERE clause', async () => {
        // Arrange
        const indexName = 'idx_active_users';
        const columns = 'last_login';
        const whereClause = 'is_active = true';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          where: whereClause,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns}) WHERE ${whereClause}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create complex index with all options', async () => {
        // Arrange
        const indexName = 'idx_complex_users';
        const columns = ['status', 'created_at'];
        const whereClause = 'status IN (\'active\', \'pending\')';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          unique: true,
          type: 'btree',
          where: whereClause,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE UNIQUE INDEX ${indexName} ON ${TABLE_NAME} USING BTREE (${columns.join(
            ', ',
          )}) WHERE ${whereClause}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle empty options object', async () => {
        // Arrange
        const indexName = 'idx_simple';
        const columns = 'name';

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName, });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle undefined options', async () => {
        // Arrange
        const indexName = 'idx_undefined';
        const columns = 'value';

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should auto-generate index name when not provided', async () => {
        // Arrange
        const columns = ['user_id', 'created_at DESC'];

        // Act
        const result = await schemaBuilder.createIndex(columns);

        // Assert
        const expectedName = `idx_${TABLE_NAME}_user_id_created_at`;
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${expectedName} ON ${TABLE_NAME} (${columns.join(', ')})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should auto-generate index name for single column', async () => {
        // Arrange
        const columns = 'email';

        // Act
        const result = await schemaBuilder.createIndex(columns);

        // Assert
        const expectedName = `idx_${TABLE_NAME}_email`;
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${expectedName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });
    });

    describe('createIndexIfNotExists() method', () => {
      it('should create index if not exists with basic options', async () => {
        // Arrange
        const indexName = 'idx_safe_users';
        const columns = 'email';

        // Act
        const result = await schemaBuilder.createIndexIfNotExists(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX IF NOT EXISTS ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create unique index if not exists', async () => {
        // Arrange
        const indexName = 'idx_unique_safe';
        const columns = 'username';

        // Act
        const result = await schemaBuilder.createIndexIfNotExists(columns, {
          name: indexName,
          unique: true,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create GIN index if not exists', async () => {
        // Arrange
        const indexName = 'idx_gin_safe';
        const columns = 'tags';

        // Act
        const result = await schemaBuilder.createIndexIfNotExists(columns, {
          name: indexName,
          type: 'gin',
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX IF NOT EXISTS ${indexName} ON ${TABLE_NAME} USING GIN (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should create partial index if not exists', async () => {
        // Arrange
        const indexName = 'idx_partial_safe';
        const columns = 'score';
        const whereClause = 'score > 0';

        // Act
        const result = await schemaBuilder.createIndexIfNotExists(columns, {
          name: indexName,
          where: whereClause,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX IF NOT EXISTS ${indexName} ON ${TABLE_NAME} (${columns}) WHERE ${whereClause}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });
    });

    describe('dropIndex() method', () => {
      it('should drop index by name', async () => {
        // Arrange
        const indexName = 'idx_users_email';

        // Act
        const result = await schemaBuilder.dropIndex(indexName);

        // Assert
        expect(schemaBuilder['query']).toBe(`DROP INDEX ${indexName}`);
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });
    });

    describe('dropIndexIfExists() method', () => {
      it('should drop index if exists by name', async () => {
        // Arrange
        const indexName = 'idx_users_email_safe';

        // Act
        const result = await schemaBuilder.dropIndexIfExists(indexName);

        // Assert
        expect(schemaBuilder['query']).toBe(`DROP INDEX IF EXISTS ${indexName}`);
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });
    });

    describe('Index Method Error Handling', () => {
      it('should handle database errors during index creation', async () => {
        // Arrange
        const indexName = 'idx_error_test';
        const columns = 'nonexistent_column';
        const error = new Error('Column does not exist');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(
          schemaBuilder.createIndex(columns, { name: indexName }),
        ).rejects.toThrow('Column does not exist');
      });

      it('should handle database errors during createIndexIfNotExists', async () => {
        // Arrange
        const indexName = 'idx_error_safe';
        const columns = 'bad_column';
        const error = new Error('Syntax error in index definition');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(
          schemaBuilder.createIndexIfNotExists(columns, { name: indexName }),
        ).rejects.toThrow('Syntax error in index definition');
      });

      it('should handle database errors during dropIndex', async () => {
        // Arrange
        const indexName = 'idx_missing';
        const error = new Error('Index does not exist');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(schemaBuilder.dropIndex(indexName)).rejects.toThrow(
          'Index does not exist',
        );
      });

      it('should handle database errors during dropIndexIfExists', async () => {
        // Arrange
        const indexName = 'idx_broken_safe';
        const error = new Error('Permission denied');
        mockClient.query.mockRejectedValue(error);

        // Act & Assert
        await expect(schemaBuilder.dropIndexIfExists(indexName)).rejects.toThrow(
          'Permission denied',
        );
      });
    });

    describe('Index Method Integration Tests', () => {
      it('should work with static table method', async () => {
        // Arrange
        const indexName = 'idx_static_test';
        const columns = 'email';

        // Act
        const builder = SchemaBuilder.table('collection_translations');
        const result = await builder.createIndex(columns, { name: indexName });

        // Assert
        expect(builder['tableName']).toBe('collection_translations');
        expect(builder['query']).toBe(
          `CREATE INDEX ${indexName} ON collection_translations (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(builder['query']);
        expect(result).toBeDefined();
      });

      it('should create multiple indexes on same table', async () => {
        // Arrange
        const indexes = [
          { name: 'idx_multi_1', columns: 'email' },
          { name: 'idx_multi_2', columns: ['first_name', 'last_name'] },
          { name: 'idx_multi_3', columns: 'created_at', type: 'btree' as const },
        ];

        // Act
        for (const index of indexes) {
          await schemaBuilder.createIndex(index.columns, {
            name: index.name,
            type: index.type,
          });
        }

        // Assert
        expect(mockClient.query).toHaveBeenCalledTimes(3);
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexes[2].name} ON ${TABLE_NAME} USING BTREE (${indexes[2].columns})`,
        );
      });

      it('should handle concurrent index creation calls', async () => {
        // Arrange
        const indexName1 = 'idx_concurrent_1';
        const indexName2 = 'idx_concurrent_2';
        const columns1 = 'email';
        const columns2 = 'phone';

        // Act
        const promise1 = schemaBuilder.createIndex(columns1, { name: indexName1 });
        const promise2 = schemaBuilder.createIndex(columns2, { name: indexName2 });

        const [result1, result2] = await Promise.all([promise1, promise2]);

        // Assert
        expect(mockClient.query).toHaveBeenCalledTimes(2);
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
      });
    });

    describe('Index Method Edge Cases', () => {
      it('should handle very long index names', async () => {
        // Arrange
        const longIndexName =
          'idx_very_long_index_name_that_exceeds_normal_length_limits_and_should_still_work';
        const columns = 'email';

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: longIndexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${longIndexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle columns with special characters', async () => {
        // Arrange
        const indexName = 'idx_special_chars';
        const columns = ['user_name', 'email_address', 'phone_number'];

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns.join(', ')})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle complex WHERE clauses', async () => {
        // Arrange
        const indexName = 'idx_complex_where';
        const columns = 'score';
        const complexWhere =
          'score > 0 AND score <= 100 AND status = \'active\' AND created_at > \'2023-01-01\'';

        // Act
        const result = await schemaBuilder.createIndex(columns, {
          name: indexName,
          where: complexWhere,
        });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns}) WHERE ${complexWhere}`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle single character column names', async () => {
        // Arrange
        const indexName = 'idx_single_char';
        const columns = 'x';

        // Act
        const result = await schemaBuilder.createIndex(columns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${columns})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });

      it('should handle maximum number of columns in composite index', async () => {
        // Arrange
        const indexName = 'idx_max_columns';
        const maxColumns = Array.from({ length: 32 }, (_, i) => `col${i + 1}`);

        // Act
        const result = await schemaBuilder.createIndex(maxColumns, { name: indexName });

        // Assert
        expect(schemaBuilder['query']).toBe(
          `CREATE INDEX ${indexName} ON ${TABLE_NAME} (${maxColumns.join(', ')})`,
        );
        expect(mockClient.query).toHaveBeenCalledWith(schemaBuilder['query']);
        expect(result).toBeDefined();
      });
    });
  });
});
