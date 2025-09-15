import { QueryBuilder } from '../builder/queryBuilder';
import {
  DatabaseConfig,
  FullDatabaseConfig,
  WhereCondition,
  SqlClauseWithoutIn,
  DatabaseClient,
} from '../constants/types/database';
import { DEFAULT_DATABASE_SETTINGS } from '../constants/constants';
import { initClient } from '../client';
import { QueryBuilderOperationNotAllowedException } from '../builder/queryBuilder/exceptions';

jest.mock('../client', ()=> {
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

describe('QueryBuilder', () => {
  let mockClient: any;
  let testConfig: DatabaseConfig;
  const TABLE_NAME = 'test_table' as any;

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
    const { initClient,getClient } = require('../client');
    await initClient(testConfig);
    mockClient = getClient();
  });

  afterEach(async () => {
    // Clean up after each test
    const { killClient } = require('../client');
    await killClient();
  });

 
  describe('Select', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
    });

    it('should build basic SELECT query with default select', () => {
      // Act
      queryBuilder.select();

      // Assert
      expect(queryBuilder['_select']).toBe('*');
    });

    it('should handle array columns and add table name prefix', () => {
      const selects = ['id', 'name', 'email', '', '   ', 'x.name', 'status'];
      // Act
      queryBuilder.select(selects);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,x.name,${TABLE_NAME}.status`,
      );
    });

    it('should handle string columns and add table name prefix', () => {
      const column = 'y.age,name,email,x.name,fg,status';
      // Act
      queryBuilder.select(column);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `y.age,${TABLE_NAME}.name,${TABLE_NAME}.email,x.name,${TABLE_NAME}.fg,${TABLE_NAME}.status`,
      );
    });

    it('should handle empty/whitespace inputs and default to asterisk', () => {
      // Test various empty inputs
      const emptyInputs = [
        ['', '   ', ''],
        [],
        '',
        '   ',
        [' ', '  ', '   ', '\t', '\n'],
        ' ,  ,   ,\t,\n',
      ];

      emptyInputs.forEach((input) => {
        queryBuilder['reset']();
        queryBuilder.select(input);
        expect(queryBuilder['_select']).toBe('*');
      });
    });

    it('should handle mixed valid and invalid values', () => {
      const mixedSelects = ['id', '', 'name', '   ', 'email', 'status'];
      // Act
      queryBuilder.select(mixedSelects);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,${TABLE_NAME}.status`,
      );
    });

    it('should handle columns with special characters and spaces', () => {
      const specialColumns = [
        'user.id',
        'user name',
        'order-status',
        'product.name',
      ];
      // Act
      queryBuilder.select(specialColumns);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `user.id,${TABLE_NAME}.user name,${TABLE_NAME}.order-status,product.name`,
      );
    });

    it('should handle null and undefined values gracefully', () => {
      const columnsWithNulls = [
        'id',
        'name',
        null as any,
        'email',
        undefined as any,
        'status',
      ];
      // Act
      queryBuilder.select(columnsWithNulls);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,${TABLE_NAME}.status`,
      );
    });

    it('should handle duplicate column names', () => {
      const duplicateColumns = ['id', 'name', 'id', 'email', 'name', 'status'];
      // Act
      queryBuilder.select(duplicateColumns);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.id,${TABLE_NAME}.email,${TABLE_NAME}.name,${TABLE_NAME}.status`,
      );
    });

    it('should support method chaining', () => {
      // Act
      const result = queryBuilder.select(['id', 'name', 'email']);

      // Assert
      expect(result).toBe(queryBuilder);
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email`,
      );
    });

    it('should handle columns that already have table prefixes', () => {
      const columnsWithPrefixes = [
        'users.id',
        'orders.status',
        'products.name',
      ];
      // Act
      queryBuilder.select(columnsWithPrefixes);

      // Assert
      expect(queryBuilder['_select']).toBe(
        'users.id,orders.status,products.name',
      );
    });

    it('should handle columns with SQL functions and aliases', () => {
      const functionColumns = [
        'COUNT(*)',
        'MAX(price)',
        'id AS user_id',
        'name AS user_name',
      ];
      // Act
      queryBuilder.select(functionColumns);

      // Assert
      expect(queryBuilder['_select']).toBe(
        `${TABLE_NAME}.COUNT(*),${TABLE_NAME}.MAX(price),${TABLE_NAME}.id AS user_id,${TABLE_NAME}.name AS user_name`,
      );
    });

    it('should throw error for column names with more than 2 parts', () => {
      const invalidColumns = ['table.column.subcolumn', 'schema.table.column'];

      // Act & Assert
      expect(() => queryBuilder.select(invalidColumns[0])).toThrow(
        'Wrong column name: table.column.subcolumn',
      );
      expect(() => queryBuilder.select(invalidColumns[1])).toThrow(
        'Wrong column name: schema.table.column',
      );
    });
  });

  describe('Where', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(async () => {
      const { initClient } = require('../client');
      await initClient(testConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
    });

    it('should add WHERE condition correctly', () => {
      // Act
      queryBuilder.where('id', '=', '1');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(1);
      expect(queryBuilder['wheres'][0]).toEqual({
        column: 'id',
        operator: '=',
        position: 0,
        type: 'where',
      });
      expect(queryBuilder['values']).toEqual(['1']);
    });

    it('should support method chaining for WHERE conditions', () => {
      // Act
      expect(queryBuilder['valuesPosition']).toBe(0);
      const result = queryBuilder
        .where('id', '=', '1')
        .where('status', '=', 'active');
      // Assert
      expect(result).toBe(queryBuilder);
      expect(queryBuilder['wheres']).toHaveLength(2);
      expect(queryBuilder['values']).toEqual(['1', 'active']);
      expect(queryBuilder['valuesPosition']).toBe(2);
    });

    it('should increment valuesPosition correctly', () => {
      // Act
      queryBuilder.where('id', '=', '1');
      queryBuilder.where('name', '=', 'test');

      // Assert
      expect(queryBuilder['valuesPosition']).toBe(2);
      expect(queryBuilder['wheres'][0]!.position).toBe(0);
      expect(queryBuilder['wheres'][1]!.position).toBe(1);
    });

    it('should handle OR WHERE conditions correctly', () => {
      // Act
      queryBuilder.orWhere('status', '=', 'active');
      queryBuilder.orWhere('status', '=', 'pending');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(2);
      expect(queryBuilder['wheres'][0]?.type).toBe('where'); // First orWhere goes to wheres
      expect(queryBuilder['wheres'][1]?.type).toBe('orWhere');
      expect(queryBuilder['values']).toEqual(['active', 'pending']);
    });

    it('should handle OR WHERE when no WHERE conditions exist', () => {
      // Act
      queryBuilder.orWhere('status', '=', 'active');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(1);
      expect(queryBuilder['wheres'][0]?.type).toBe('where'); // First orWhere goes to wheres when no wheres exist
      expect(queryBuilder['valuesPosition']).toBe(1);
    });

    it('should handle complex WHERE and OR WHERE combinations', () => {
      // Act
      queryBuilder.where('age', '>', '18');
      queryBuilder.where('country', '=', 'US');
      queryBuilder.orWhere('role', '=', 'admin');
      queryBuilder.orWhere('role', '=', 'moderator');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(4);
      expect(queryBuilder['wheres'][0]?.type).toBe('where');
      expect(queryBuilder['wheres'][1]?.type).toBe('where');
      expect(queryBuilder['wheres'][2]?.type).toBe('orWhere');
      expect(queryBuilder['wheres'][3]?.type).toBe('orWhere');
      expect(queryBuilder['values']).toEqual([
        '18',
        'US',
        'admin',
        'moderator',
      ]);
      expect(queryBuilder['valuesPosition']).toBe(4);
    });

    it('should handle different WHERE operators', () => {
      // Act
      queryBuilder.where('id', '>', '0');
      queryBuilder.where('status', '!=', 'deleted');
      queryBuilder.where('created_at', '>=', '2023-01-01');
      queryBuilder.where('price', '<', '100.00');
      queryBuilder.where('category', 'LIKE', '%tech%');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(5);
      expect(queryBuilder['values']).toEqual([
        '0',
        'deleted',
        '2023-01-01',
        '100.00',
        '%tech%',
      ]);
      expect(queryBuilder['valuesPosition']).toBe(5);
    });

    it('should handle various data types in WHERE conditions', () => {
      // Act
      queryBuilder.orWhere('deleted_at', 'IS', null);
      queryBuilder.orWhere('age', '>=', 18);
      queryBuilder.orWhere('score', '>', 85.5);
      queryBuilder.where('email', 'LIKE', '%@example.com');
      queryBuilder.whereIn('status', ['active', 'pending', 'review']);

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(5);
      expect(queryBuilder['values']).toEqual([
        null,
        18,
        85.5,
        '%@example.com',
        'active',
        'pending',
        'review',
      ]);
      expect(queryBuilder['valuesPosition']).toBe(7);
    });

    it('should handle complex table and column references', () => {
      // Act
      queryBuilder.where('users.id', '=', '123');
      queryBuilder.orWhereIn('orders.status', ['pending', 'processing']);
      queryBuilder.orWhere('products.category_id', '=', '5');

      // Assert
      expect(queryBuilder['wheres']).toHaveLength(3);
      expect(queryBuilder['values']).toEqual([
        '123',
        'pending',
        'processing',
        '5',
      ]);
      expect(queryBuilder['valuesPosition']).toBe(4);
    });

    it('should handle method chaining with complex conditions', () => {
      // Act
      const result = queryBuilder
        .where('status', '=', 'active')
        .where('age', '>=', '18')
        .orWhere('role', '=', 'admin')
        .where('country', '=', 'US')
        .orWhere('subscription', '=', 'premium');

      // Assert
      expect(result).toBe(queryBuilder);
      expect(queryBuilder['wheres']).toHaveLength(5);
      expect(queryBuilder['values']).toEqual([
        'active',
        '18',
        'admin',
        'US',
        'premium',
      ]);
      expect(queryBuilder['valuesPosition']).toBe(5);
    });
  });

  describe('buildWhereQuery', () => {
    let queryBuilder: QueryBuilder;
    let postgresConfig: DatabaseConfig;
    let mysqlConfig: DatabaseConfig;

    beforeEach(async () => {
      postgresConfig = {
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'postgres',
      };

      mysqlConfig = {
        host: 'localhost',
        port: 3306,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'mysql',
      };
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
    });

    it('should build WHERE query for PostgreSQL with correct parameter placeholder', async () => {
      await initClient(postgresConfig);
      // Arrange
      const where: WhereCondition = {
        column: 'id',
        operator: '=',
        position: 0,
        type: 'where',
      };

      // Act
      const result = queryBuilder['buildWhereQuery'](where);

      // Assert
      expect(result).toBe(`${TABLE_NAME}.id = $1`);
    });

    it('should build WHERE query for MySQL with correct parameter placeholder', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      // Arrange
      const where: WhereCondition = {
        column: 'name',
        operator: '>',
        position: 1,
        type: 'where',
      };

      // Act
      const result = queryBuilder['buildWhereQuery'](where);

      // Assert
      expect(result).toBe(`${TABLE_NAME}.name > ?`);
    });

    it('should build WHERE query with table-qualified column names for both databases', async () => {
      // Test PostgreSQL
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      const wherePostgres: WhereCondition = {
        column: 'users.id',
        operator: '=',
        position: 2,
        type: 'where',
      };
      expect(queryBuilder['buildWhereQuery'](wherePostgres)).toBe(
        `users.id = $3`,
      );

      // Test MySQL
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      const whereMysql: WhereCondition = {
        column: 'orders.status',
        operator: 'LIKE',
        position: 3,
        type: 'where',
      };
      expect(queryBuilder['buildWhereQuery'](whereMysql)).toBe(
        `orders.status LIKE ?`,
      );
    });

    it('should handle all operators correctly for both databases', async () => {
      const operators: Array<SqlClauseWithoutIn> = [
        '=',
        '>',
        '<',
        '>=',
        '<=',
        '!=',
        'LIKE',
        'IS',
        'IS NOT',
      ];

      // Test PostgreSQL
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      operators.forEach((operator, index) => {
        const where: WhereCondition = {
          column: 'age',
          operator,
          position: index,
          type: 'where',
        };
        const result = queryBuilder['buildWhereQuery'](where);
        expect(result).toBe(`${TABLE_NAME}.age ${operator} $${index + 1}`);
      });

      // Test MySQL
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      operators.forEach((operator) => {
        const where: WhereCondition = {
          column: 'status',
          operator,
          position: 0,
          type: 'where',
        };
        const result = queryBuilder['buildWhereQuery'](where);
        expect(result).toBe(`${TABLE_NAME}.status ${operator} ?`);
      });
    });

    it('should handle complex column names and edge cases', () => {
      // Test complex column names
      const where: WhereCondition = {
        column: 'user_profile.first_name',
        operator: 'LIKE',
        position: 4,
        type: 'where',
      };
      expect(queryBuilder['buildWhereQuery'](where)).toBe(
        `user_profile.first_name LIKE $5`,
      );

      // Test large position values
      const whereLarge: WhereCondition = {
        column: 'email',
        operator: 'LIKE',
        position: 999,
        type: 'where',
      };
      expect(queryBuilder['buildWhereQuery'](whereLarge)).toBe(
        `${TABLE_NAME}.email LIKE $1000`,
      );
    });
  });

  describe('buildSelectQuery', () => {
    let queryBuilder: QueryBuilder;
    let postgresConfig: DatabaseConfig;

    beforeEach(async () => {
      postgresConfig = {
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'postgres',
      };
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
    });

    afterEach(() => {
      queryBuilder['reset']();
    });

    it('should build basic SELECT query', () => {
      // Arrange
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME}`);
    });

    it('should build SELECT query with specific columns', () => {
      // Arrange
      const targetQuery = `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,foreignTable.id FROM ${TABLE_NAME}`;
      queryBuilder.select('id,name,email, foreignTable.id');
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(targetQuery);
    });

    it('should build SELECT query with joins', () => {
      const targetQuery = `SELECT * FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id`;
      // Arrange
      queryBuilder.join('user_id', 'users', 'id');
      queryBuilder['buildSelectQuery']();
      // Assert
      expect(queryBuilder['query']).toBe(targetQuery);
    });

    it('should build SELECT query with multiple joins and columns', () => {
      const targetQuery = `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,users.id,orders.id FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN orders ON orders.id = ${TABLE_NAME}.user_id`;
      // Arrange
      queryBuilder
        .select('id,name,email,users.id,orders.id')
        .join('user_id', 'users', 'id')
        .join('user_id', 'orders', 'id', 'LEFT');

      queryBuilder['buildSelectQuery']();
      // Assert
      expect(queryBuilder['query']).toBe(targetQuery);
    });

    it('should build complex SELECT query with joins, columns, and WHERE conditions', async () => {
      await initClient(postgresConfig);
      const targetQuery = `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,users.id,orders.id FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN orders ON orders.id = ${TABLE_NAME}.user_id \nWHERE users.id LIKE $1 \nOR users.id IS NOT $2 \nAND orders.id IN ($3,$4) \nAND orders.id = $5 \nOR orders.id = $6 \nOR orders.id IN ($7,$8)`;

      // Arrange
      queryBuilder
        .select('id,name,email,users.id,orders.id')
        .join('user_id', 'users', 'id')
        .join('user_id', 'orders', 'id', 'LEFT')
        .where('users.id', 'LIKE', '%1%')
        .orWhere('users.id', 'IS NOT', null)
        .whereIn('orders.id', [2, 3])
        .where('orders.id', '=', 4)
        .orWhere('orders.id', '=', 5)
        .orWhereIn('orders.id', [6, 7]);

      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['valuesPosition']).toBe(8);
      expect(queryBuilder['values']).toEqual(['%1%', null, 2, 3, 4, 5, 6, 7]);
      expect(queryBuilder['query']).toBe(targetQuery);
    });

    it('should build SELECT query with LIMIT clause', () => {
      // Arrange
      queryBuilder.limit(10);
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME} \nLIMIT 10`);
    });

    it('should build SELECT query with OFFSET clause', () => {
      // Arrange
      queryBuilder.offset(5);
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME} \nOFFSET 5`);
    });

    it('should build SELECT query with ORDER BY clause', () => {
      // Arrange
      queryBuilder.orderBy('name', 'ASC');
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME} \nORDER BY name ASC`);
    });

    it('should build SELECT query with ORDER BY DESC clause', () => {
      // Arrange
      queryBuilder.orderBy('created_at', 'DESC');
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME} \nORDER BY created_at DESC`);
    });

    it('should build SELECT query with LIMIT, OFFSET, and ORDER BY clauses', () => {
      // Arrange
      queryBuilder
        .orderBy('name', 'ASC')
        .limit(10)
        .offset(5);
      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['query']).toBe(`SELECT * FROM ${TABLE_NAME} \nORDER BY name ASC \nLIMIT 10 \nOFFSET 5`);
    });

    it('should build complete SELECT query with all clauses', () => {
      // Arrange
      const targetQuery = `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email,users.id,orders.id FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN orders ON orders.id = ${TABLE_NAME}.user_id \nWHERE users.id LIKE $1 \nOR users.id IS NOT $2 \nAND orders.id IN ($3,$4) \nAND orders.id = $5 \nOR orders.id = $6 \nOR orders.id IN ($7,$8) \nORDER BY name ASC \nLIMIT 10 \nOFFSET 5`;

      queryBuilder
        .select('id,name,email,users.id,orders.id')
        .join('user_id', 'users', 'id')
        .join('user_id', 'orders', 'id', 'LEFT')
        .where('users.id', 'LIKE', '%1%')
        .orWhere('users.id', 'IS NOT', null)
        .whereIn('orders.id', [2, 3])
        .where('orders.id', '=', 4)
        .orWhere('orders.id', '=', 5)
        .orWhereIn('orders.id', [6, 7])
        .orderBy('name', 'ASC')
        .limit(10)
        .offset(5);

      queryBuilder['buildSelectQuery']();

      // Assert
      expect(queryBuilder['valuesPosition']).toBe(8);
      expect(queryBuilder['values']).toEqual(['%1%', null, 2, 3, 4, 5, 6, 7]);
      expect(queryBuilder['query']).toBe(targetQuery);
    });
  });

  describe('buildInsertQuery', () => {
    let queryBuilder: QueryBuilder;
    let postgresConfig: DatabaseConfig;
    let mysqlConfig: DatabaseConfig;

    beforeEach(() => {
      postgresConfig = {
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'postgres',
      };

      mysqlConfig = {
        host: 'localhost',
        port: 3306,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'mysql',
      };
    });

    it('should set INSERT query for PostgreSQL with correct parameter placeholders', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'age'];
      const values = ['John', 'john@example.com', 25];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name,email,age) VALUES ($1,$2,$3)`,
      );
    });

    it('should set INSERT query for MySQL with correct parameter placeholders', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'age'];
      const values = ['John', 'john@example.com', 25];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name,email,age) VALUES (?,?,?)`,
      );
    });

    it('should handle single column and value', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name) VALUES ($1)`,
      );
    });

    it('should handle various data types in values', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'age', 'active', 'created_at', 'score'];
      const values = ['John', 25, true, new Date('2023-01-01'), 85.5];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name,age,active,created_at,score) VALUES ($1,$2,$3,$4,$5)`,
      );
    });

    it('should handle null values', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'phone'];
      const values = ['John', null, '123-456-7890'];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name,email,phone) VALUES (?,?,?)`,
      );
    });

    it('should handle empty strings and special characters', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'description', 'code'];
      const values = ['', 'Special chars: !@#$%^&*()', 'ABC-123_xyz'];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name,description,code) VALUES ($1,$2,$3)`,
      );
    });

    it('should handle table-qualified column names', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['users.name', 'users.email', 'orders.status'];
      const values = ['John', 'john@example.com', 'pending'];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (users.name,users.email,orders.status) VALUES ($1,$2,$3)`,
      );
    });

    it('should throw error when columns and values length mismatch', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email'];
      const values = ['John']; // Missing one value

      expect(() => queryBuilder['buildInsertQuery'](columns, values)).toThrow(
        'Columns and values must have the same length',
      );
    });

    it('should throw error when values length exceeds columns length', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John', 'john@example.com']; // Extra value

      expect(() => queryBuilder['buildInsertQuery'](columns, values)).toThrow(
        'Columns and values must have the same length',
      );
    });

    it('should throw error when incompatible operations exist before insert', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      // Add incompatible operations
      queryBuilder.select(['id', 'name']);
      queryBuilder.where('id', '=', 1);

      expect(queryBuilder['operationsChain']).toEqual(['select', 'where']);
      const columns = ['name'];
      const values = ['John'];

      expect(() => queryBuilder['buildInsertQuery'](columns, values)).toThrow(
        'Method chaining not allowed before insert, you can only chain operations: ',
      );
    });

    it('should allow insert when no operations exist', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      expect(() =>
        queryBuilder['buildInsertQuery'](columns, values),
      ).not.toThrow();
      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} (name) VALUES ($1)`,
      );
    });

    it('should handle large number of columns and values', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = Array.from({ length: 10 }, (_, i) => `col${i + 1}`);
      const values = Array.from({ length: 10 }, (_, i) => `value${i + 1}`);

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toContain(
        'col1,col2,col3,col4,col5,col6,col7,col8,col9,col10',
      );
      expect(queryBuilder['query']).toContain('$1,$2,$3,$4,$5,$6,$7,$8,$9,$10');
    });

    it('should handle empty columns and values arrays', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns: string[] = [];
      const values: any[] = [];

      queryBuilder['buildInsertQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `INSERT INTO ${TABLE_NAME} () VALUES ()`,
      );
    });
  });

  describe('buildUpdateQuery', () => {
    let queryBuilder: QueryBuilder;
    let postgresConfig: DatabaseConfig;
    let mysqlConfig: DatabaseConfig;

    beforeEach(() => {
      postgresConfig = {
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'postgres',
      };

      mysqlConfig = {
        host: 'localhost',
        port: 3306,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'mysql',
      };
    });

    it('should set UPDATE query for PostgreSQL with correct parameter placeholders', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'age'];
      const values = ['John', 'john@example.com', 25];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1,email = $2,age = $3 \nWHERE ${TABLE_NAME}.id = $4`,
      );
    });

    it('should set UPDATE query for MySQL with correct parameter placeholders', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'age'];
      const values = ['John', 'john@example.com', 25];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = ?,email = ?,age = ? \nWHERE ${TABLE_NAME}.id = ?`,
      );
    });

    it('should handle single column and value update', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1 \nWHERE ${TABLE_NAME}.id = $2`,
      );
    });

    it('should handle various data types in values', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'age', 'active', 'created_at', 'score'];
      const values = ['John', 25, true, new Date('2023-01-01'), 85.5];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1,age = $2,active = $3,created_at = $4,score = $5 \nWHERE ${TABLE_NAME}.id = $6`,
      );
    });

    it('should handle null values', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email', 'phone'];
      const values = ['John', null, '123-456-7890'];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = ?,email = ?,phone = ? \nWHERE ${TABLE_NAME}.id = ?`,
      );
    });

    it('should handle empty strings and special characters', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'description', 'code'];
      const values = ['', 'Special chars: !@#$%^&*()', 'ABC-123_xyz'];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1,description = $2,code = $3 \nWHERE ${TABLE_NAME}.id = $4`,
      );
    });

    it('should handle table-qualified column names', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['users.name', 'users.email', 'orders.status'];
      const values = ['John', 'john@example.com', 'pending'];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET users.name = $1,users.email = $2,orders.status = $3 \nWHERE ${TABLE_NAME}.id = $4`,
      );
    });

    it('should handle multiple WHERE conditions', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email'];
      const values = ['John', 'john@example.com'];

      queryBuilder.where('id', '=', 1);
      queryBuilder.where('status', '=', 'active');
      queryBuilder.orWhere('role', '=', 'admin');
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1,email = $2 \nWHERE ${TABLE_NAME}.id = $3 \nAND ${TABLE_NAME}.status = $4 \nOR ${TABLE_NAME}.role = $5`,
      );
    });

    it('should throw error when columns and values length mismatch', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name', 'email'];
      const values = ['John']; // Missing one value

      queryBuilder.where('id', '=', 1);

      expect(() => queryBuilder['buildUpdateQuery'](columns, values)).toThrow(
        'Columns and values must have the same length',
      );
    });

    it('should throw error when values length exceeds columns length', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John', 'john@example.com']; // Extra value

      queryBuilder.where('id', '=', 1);

      expect(() => queryBuilder['buildUpdateQuery'](columns, values)).toThrow(
        'Columns and values must have the same length',
      );
    });

    it('should throw error when incompatible operations exist before update', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      // Add incompatible operations
      queryBuilder.select(['id', 'name']);
      queryBuilder.join('user_id', 'users', 'id');

      const columns = ['name'];
      const values = ['John'];

      expect(() => queryBuilder['buildUpdateQuery'](columns, values)).toThrow(
        'Method chaining not allowed before update, you can only chain operations: where',
      );
    });

    it('should allow update when only where operations exist', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      queryBuilder.where('id', '=', 1);
      queryBuilder.orWhere('status', '=', 'active');

      expect(() =>
        queryBuilder['buildUpdateQuery'](columns, values),
      ).not.toThrow();
      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET name = $1 \nWHERE ${TABLE_NAME}.id = $2 \nOR ${TABLE_NAME}.status = $3`,
      );
    });

    it('should throw error when no WHERE clause exists and allowUpdateWithoutWhere is false', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      expect(() => queryBuilder['buildUpdateQuery'](columns, values)).toThrow(
        QueryBuilderOperationNotAllowedException,
      );
    });

    it('should allow update without WHERE when allowUpdateWithoutWhere is true', async () => {
      const configWithAllowUpdate = {
        ...postgresConfig,
        settings: { allowUpdateWithoutWhere: true },
      };

      await initClient(configWithAllowUpdate);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = ['name'];
      const values = ['John'];

      expect(() =>
        queryBuilder['buildUpdateQuery'](columns, values),
      ).not.toThrow();
      expect(queryBuilder['query']).toBe(`UPDATE ${TABLE_NAME} SET name = $1`);
    });

    it('should handle large number of columns and values', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns = Array.from({ length: 5 }, (_, i) => `col${i + 1}`);
      const values = Array.from({ length: 5 }, (_, i) => `value${i + 1}`);

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toContain(
        'col1 = $1,col2 = $2,col3 = $3,col4 = $4,col5 = $5',
      );
      expect(queryBuilder['query']).toContain('WHERE');
    });

    it('should handle empty columns and values arrays', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      const columns: string[] = [];
      const values: any[] = [];

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildUpdateQuery'](columns, values);

      expect(queryBuilder['query']).toBe(
        `UPDATE ${TABLE_NAME} SET  \nWHERE ${TABLE_NAME}.id = ?`,
      );
    });
  });

  describe('buildDeleteQuery', () => {
    let queryBuilder: QueryBuilder;
    let postgresConfig: DatabaseConfig;
    let mysqlConfig: DatabaseConfig;

    beforeEach(() => {
      postgresConfig = {
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'postgres',
      };

      mysqlConfig = {
        host: 'localhost',
        port: 3306,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        client: 'mysql',
      };
    });

    it('should build DELETE query for PostgreSQL with WHERE clause', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1`,
      );
    });

    it('should build DELETE query for MySQL with WHERE clause', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '=', 1);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = ?`,
      );
    });

    it('should build DELETE query with multiple WHERE conditions', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '=', 1);
      queryBuilder.where('status', '=', 'active');
      queryBuilder.orWhere('role', '=', 'admin');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1 \nAND ${TABLE_NAME}.status = $2 \nOR ${TABLE_NAME}.role = $3`,
      );
    });

    it('should build DELETE query with complex WHERE conditions', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('age', '>', 18);
      queryBuilder.where('country', '=', 'US');
      queryBuilder.orWhere('role', '=', 'admin');
      queryBuilder.orWhere('role', '=', 'moderator');
      queryBuilder.whereIn('status', ['active', 'pending']);
      queryBuilder.orWhereIn('category', ['tech', 'business']);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.age > $1 \nAND ${TABLE_NAME}.country = $2 \nOR ${TABLE_NAME}.role = $3 \nOR ${TABLE_NAME}.role = $4 \nAND ${TABLE_NAME}.status IN ($5,$6) \nOR ${TABLE_NAME}.category IN ($7,$8)`,
      );
    });

    it('should build DELETE query with table-qualified column names', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('users.id', '=', 123);
      queryBuilder.orWhereIn('orders.status', ['pending', 'processing']);
      queryBuilder.orWhere('products.category_id', '=', 5);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE users.id = $1 \nOR orders.status IN ($2,$3) \nOR products.category_id = $4`,
      );
    });

    it('should build DELETE query with various operators', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '>', 0);
      queryBuilder.where('status', '!=', 'deleted');
      queryBuilder.where('created_at', '>=', '2023-01-01');
      queryBuilder.where('price', '<', 100.0);
      queryBuilder.where('category', 'LIKE', '%tech%');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id > ? \nAND ${TABLE_NAME}.status != ? \nAND ${TABLE_NAME}.created_at >= ? \nAND ${TABLE_NAME}.price < ? \nAND ${TABLE_NAME}.category LIKE ?`,
      );
    });

    it('should build DELETE query with null and special values', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('deleted_at', 'IS', null);
      queryBuilder.where('age', '>=', 18);
      queryBuilder.where('score', '>', 85.5);
      queryBuilder.orWhere('email', 'LIKE', '%@example.com');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.deleted_at IS $1 \nAND ${TABLE_NAME}.age >= $2 \nAND ${TABLE_NAME}.score > $3 \nOR ${TABLE_NAME}.email LIKE $4`,
      );
    });

    it('should throw error when incompatible operations exist before delete', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      // Add incompatible operations
      queryBuilder.select(['id', 'name']);
      queryBuilder.join('user_id', 'users', 'id');

      expect(() => queryBuilder['buildDeleteQuery']()).toThrow(
        'Method chaining not allowed before delete, you can only chain operations: where',
      );
    });

    it('should allow delete when only where operations exist', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '=', 1);
      queryBuilder.orWhere('status', '=', 'active');

      expect(() => queryBuilder['buildDeleteQuery']()).not.toThrow();
      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1 \nOR ${TABLE_NAME}.status = $2`,
      );
    });

    it('should throw error when no WHERE clause exists and allowDeleteWithoutWhere is false', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      expect(() => queryBuilder['buildDeleteQuery']()).toThrow(
        QueryBuilderOperationNotAllowedException,
      );
    });

    it('should allow delete without WHERE when allowDeleteWithoutWhere is true', async () => {
      const configWithAllowDelete = {
        ...postgresConfig,
        settings: { allowDeleteWithoutWhere: true },
      };

      await initClient(configWithAllowDelete);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      expect(() => queryBuilder['buildDeleteQuery']()).not.toThrow();
      expect(queryBuilder['query']).toBe(`DELETE FROM ${TABLE_NAME}`);
    });

    it('should handle empty WHERE conditions when allowDeleteWithoutWhere is true', async () => {
      const configWithAllowDelete = {
        ...mysqlConfig,
        settings: { allowDeleteWithoutWhere: true },
      };

      await initClient(configWithAllowDelete);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(`DELETE FROM ${TABLE_NAME}`);
    });

    it('should handle complex WHERE conditions with mixed data types', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('id', '=', 1);
      queryBuilder.where('name', 'LIKE', '%John%');
      queryBuilder.where('age', '>=', 18);
      queryBuilder.where('active', '=', true);
      queryBuilder.where('created_at', '>=', new Date('2023-01-01'));
      queryBuilder.orWhere('score', '>', 85.5);
      queryBuilder.orWhere('deleted_at', 'IS', null);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1 \nAND ${TABLE_NAME}.name LIKE $2 \nAND ${TABLE_NAME}.age >= $3 \nAND ${TABLE_NAME}.active = $4 \nAND ${TABLE_NAME}.created_at >= $5 \nOR ${TABLE_NAME}.score > $6 \nOR ${TABLE_NAME}.deleted_at IS $7`,
      );
    });

    it('should handle WHERE IN and OR WHERE IN conditions', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);
      queryBuilder.whereIn('status', ['active', 'pending', 'review']);
      queryBuilder.where('id', '=', 1);
      queryBuilder.orWhereIn('category', ['tech', 'business', 'finance']);
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status IN (?,?,?) \nAND ${TABLE_NAME}.id = ? \nOR ${TABLE_NAME}.category IN (?,?,?)`,
      );
    });

    it('should handle single WHERE condition', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('status', '=', 'deleted');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status = $1`,
      );
    });

    it('should handle single OR WHERE condition (converted to WHERE)', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.orWhere('status', '=', 'deleted');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status = $1`,
      );
    });

    it('should handle large number of WHERE conditions', async () => {
      await initClient(postgresConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      // Add multiple WHERE conditions
      for (let i = 1; i <= 5; i++) {
        queryBuilder.where(`col${i}`, '=', `value${i}`);
      }

      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toContain('DELETE FROM');
      expect(queryBuilder['query']).toContain('WHERE');
      expect(queryBuilder['query']).toContain('$1');
      expect(queryBuilder['query']).toContain('$5');
    });

    it('should handle WHERE conditions with special characters in values', async () => {
      await initClient(mysqlConfig);
      queryBuilder = new QueryBuilder(TABLE_NAME);

      queryBuilder.where('name', 'LIKE', '%Special chars: !@#$%^&*()%');
      queryBuilder.where('code', '=', 'ABC-123_xyz');
      queryBuilder['buildDeleteQuery']();

      expect(queryBuilder['query']).toBe(
        `DELETE FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.name LIKE ? \nAND ${TABLE_NAME}.code = ?`,
      );
    });
  });
});
