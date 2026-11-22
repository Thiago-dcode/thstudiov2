import { DatabaseConfig, FullDatabaseConfig, Join } from '@repo/common-lib/types/database';
import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
import { BaseRepository } from '../repositories/base.repository';

// Mock the client module (PostgreSQL only)
jest.mock('../client', () => {
  const Client = (config: FullDatabaseConfig) => {
    return {
      _config: config,
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      set config(config: FullDatabaseConfig) {
        this._config = config;
      },
      get config() {
        return this._config;
      },
    };
  };
  let mockClient: any = null;

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
      mockClient = Client(fullConfig);
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

// Concrete implementation of BaseRepository for testing
class TestRepository extends BaseRepository {
  constructor(tableName: any, options?: any) {
    super(tableName, options);
  }

  // Expose queryBuilder for inspection
  public getQueryBuilder() {
    return this.query();
  }

  // Build and return the SQL query string for testing
  public buildAndGetSelectQuery(
    options?: {
      select?: string[] | string;
      join?: Join[];
      wheres?: { column: string; operator: any; value: any }[];
      orWheres?: { column: string; operator: any; value: any }[];
    }
  ) {
    const query = this.query();
    this['buildQuery'](query, options);
    query['buildSelectQuery']();
    return {
      sql: query['query'],
      values: query['values'],
      valuesPosition: query['valuesPosition'],
    };
  }
}

describe('BaseRepository - buildQuery', () => {
  const TABLE_NAME = 'test_table' as any;
  let testConfig: DatabaseConfig;
  let repository: TestRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    testConfig = {
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
      client: 'postgres',
    };

    const { initClient } = require('../client');
    await initClient(testConfig);
    repository = new TestRepository(TABLE_NAME);
  });

  afterEach(async () => {
    const { killClient } = require('../client');
    await killClient();
  });

  // ============================================================================
  // WHERES TESTS
  // ============================================================================
  describe('wheres - Basic WHERE conditions', () => {
    it('should build query with single WHERE condition using = operator', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'id', operator: '=', value: 1 }],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1`);
      expect(values).toEqual([1]);
    });

    it('should build query with multiple WHERE conditions (AND)', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: '=', value: 'active' },
          { column: 'age', operator: '>=', value: 18 },
          { column: 'country', operator: '=', value: 'US' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status = $1 \nAND ${TABLE_NAME}.age >= $2 \nAND ${TABLE_NAME}.country = $3`
      );
      expect(values).toEqual(['active', 18, 'US']);
    });

    it('should build query with all comparison operators', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'col1', operator: '=', value: 'val1' },
          { column: 'col2', operator: '!=', value: 'val2' },
          { column: 'col3', operator: '>', value: 10 },
          { column: 'col4', operator: '<', value: 100 },
          { column: 'col5', operator: '>=', value: 5 },
          { column: 'col6', operator: '<=', value: 50 },
          { column: 'col7', operator: 'LIKE', value: '%test%' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.col1 = $1 \nAND ${TABLE_NAME}.col2 != $2 \nAND ${TABLE_NAME}.col3 > $3 \nAND ${TABLE_NAME}.col4 < $4 \nAND ${TABLE_NAME}.col5 >= $5 \nAND ${TABLE_NAME}.col6 <= $6 \nAND ${TABLE_NAME}.col7 LIKE $7`
      );
      expect(values).toEqual(['val1', 'val2', 10, 100, 5, 50, '%test%']);
    });

    it('should build query with NULL value using IS operator', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'deleted_at', operator: 'IS', value: null },
        ],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.deleted_at IS NULL`);
      expect(values).toEqual([]);
    });

    it('should build query with NULL value using IS NOT operator', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'verified_at', operator: 'IS NOT', value: null },
        ],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.verified_at IS NOT NULL`);
      expect(values).toEqual([]);
    });

    it('should build query with table-qualified column names', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'users.id', operator: '=', value: 123 },
          { column: 'orders.status', operator: '=', value: 'pending' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE users.id = $1 \nAND orders.status = $2`
      );
      expect(values).toEqual([123, 'pending']);
    });

    it('should build query with mixed data types', () => {
      const date = new Date('2024-01-01');
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'name', operator: '=', value: 'John' },
          { column: 'age', operator: '=', value: 25 },
          { column: 'active', operator: '=', value: true },
          { column: 'score', operator: '>', value: 85.5 },
          { column: 'created_at', operator: '>=', value: date },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.name = $1 \nAND ${TABLE_NAME}.age = $2 \nAND ${TABLE_NAME}.active = $3 \nAND ${TABLE_NAME}.score > $4 \nAND ${TABLE_NAME}.created_at >= $5`
      );
      expect(values).toEqual(['John', 25, true, 85.5, date]);
    });
  });

  // ============================================================================
  // WHERE IN TESTS
  // ============================================================================
  describe('wheres - IN operator', () => {
    it('should build query with WHERE IN clause', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: 'IN', value: ['active', 'pending', 'review'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status IN ($1,$2,$3)`
      );
      expect(values).toEqual(['active', 'pending', 'review']);
    });

    it('should build query with WHERE IN clause with single value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: 'IN', value: 'active' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status IN ($1)`
      );
      expect(values).toEqual(['active']);
    });

    it('should build query with WHERE IN combined with regular WHERE', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'category', operator: '=', value: 'tech' },
          { column: 'status', operator: 'IN', value: ['active', 'pending'] },
          { column: 'age', operator: '>=', value: 18 },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.category = $1 \nAND ${TABLE_NAME}.status IN ($2,$3) \nAND ${TABLE_NAME}.age >= $4`
      );
      expect(values).toEqual(['tech', 'active', 'pending', 18]);
    });

    it('should build query with WHERE IN using numeric values', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'user_id', operator: 'IN', value: [1, 2, 3, 4, 5] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.user_id IN ($1,$2,$3,$4,$5)`
      );
      expect(values).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle array value with non-IN operator by using whereIn', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: 'IN', value: ['active', 'pending'] },
        ],
      });

      // Based on the implementation, array values trigger whereIn regardless of operator
      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status IN ($1,$2)`
      );
      expect(values).toEqual(['active', 'pending']);
    });
  });

  // ============================================================================
  // WHERE NOT IN TESTS
  // ============================================================================
  describe('wheres - NOT IN operator', () => {
    it('should build query with WHERE NOT IN clause', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: 'NOT IN', value: ['deleted', 'archived', 'banned'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status NOT IN ($1,$2,$3)`
      );
      expect(values).toEqual(['deleted', 'archived', 'banned']);
    });

    it('should build query with WHERE NOT IN with single value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: 'NOT IN', value: 'deleted' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status NOT IN ($1)`
      );
      expect(values).toEqual(['deleted']);
    });

    it('should build query with WHERE NOT IN combined with other conditions', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'category', operator: '=', value: 'tech' },
          { column: 'status', operator: 'NOT IN', value: ['deleted', 'archived'] },
          { column: 'is_active', operator: '=', value: true },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.category = $1 \nAND ${TABLE_NAME}.status NOT IN ($2,$3) \nAND ${TABLE_NAME}.is_active = $4`
      );
      expect(values).toEqual(['tech', 'deleted', 'archived', true]);
    });

    it('should build query with both IN and NOT IN clauses', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'category', operator: 'IN', value: ['tech', 'science'] },
          { column: 'status', operator: 'NOT IN', value: ['deleted', 'archived'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.category IN ($1,$2) \nAND ${TABLE_NAME}.status NOT IN ($3,$4)`
      );
      expect(values).toEqual(['tech', 'science', 'deleted', 'archived']);
    });
  });

  // ============================================================================
  // OR WHERES TESTS
  // ============================================================================
  describe('orWheres - Basic OR WHERE conditions', () => {
    it('should build query with single OR WHERE condition', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        orWheres: [
          { column: 'role', operator: '=', value: 'admin' },
        ],
      });

      // First orWhere should be converted to WHERE when no wheres exist
      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.role = $1`);
      expect(values).toEqual(['admin']);
    });

    it('should build query with WHERE followed by OR WHERE', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: '=', value: 'active' },
        ],
        orWheres: [
          { column: 'role', operator: '=', value: 'admin' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status = $1 \nOR ${TABLE_NAME}.role = $2`
      );
      expect(values).toEqual(['active', 'admin']);
    });

    it('should build query with multiple OR WHERE conditions', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'active', operator: '=', value: true },
        ],
        orWheres: [
          { column: 'role', operator: '=', value: 'admin' },
          { column: 'role', operator: '=', value: 'moderator' },
          { column: 'role', operator: '=', value: 'superuser' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.active = $1 \nOR ${TABLE_NAME}.role = $2 \nOR ${TABLE_NAME}.role = $3 \nOR ${TABLE_NAME}.role = $4`
      );
      expect(values).toEqual([true, 'admin', 'moderator', 'superuser']);
    });

    it('should build query with multiple WHERE and multiple OR WHERE', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'status', operator: '=', value: 'active' },
          { column: 'verified', operator: '=', value: true },
        ],
        orWheres: [
          { column: 'role', operator: '=', value: 'admin' },
          { column: 'is_superuser', operator: '=', value: true },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.status = $1 \nAND ${TABLE_NAME}.verified = $2 \nOR ${TABLE_NAME}.role = $3 \nOR ${TABLE_NAME}.is_superuser = $4`
      );
      expect(values).toEqual(['active', true, 'admin', true]);
    });

    it('should build query with OR WHERE using different operators', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'id', operator: '>', value: 0 },
        ],
        orWheres: [
          { column: 'priority', operator: '>=', value: 5 },
          { column: 'name', operator: 'LIKE', value: '%important%' },
          { column: 'deleted_at', operator: 'IS', value: null },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id > $1 \nOR ${TABLE_NAME}.priority >= $2 \nOR ${TABLE_NAME}.name LIKE $3 \nOR ${TABLE_NAME}.deleted_at IS NULL`
      );
      expect(values).toEqual([0, 5, '%important%']);
    });
  });

  // ============================================================================
  // OR WHERE IN TESTS
  // ============================================================================
  describe('orWheres - OR WHERE IN operator', () => {
    it('should build query with OR WHERE IN clause', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'category', operator: '=', value: 'tech' },
        ],
        orWheres: [
          { column: 'status', operator: 'IN', value: ['featured', 'promoted'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.category = $1 \nOR ${TABLE_NAME}.status IN ($2,$3)`
      );
      expect(values).toEqual(['tech', 'featured', 'promoted']);
    });

    it('should build query with multiple OR WHERE IN clauses', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'active', operator: '=', value: true },
        ],
        orWheres: [
          { column: 'status', operator: 'IN', value: ['pending', 'review'] },
          { column: 'priority', operator: 'IN', value: [1, 2, 3] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.active = $1 \nOR ${TABLE_NAME}.status IN ($2,$3) \nOR ${TABLE_NAME}.priority IN ($4,$5,$6)`
      );
      expect(values).toEqual([true, 'pending', 'review', 1, 2, 3]);
    });

    it('should build query with OR WHERE IN with single value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'id', operator: '=', value: 1 },
        ],
        orWheres: [
          { column: 'status', operator: 'IN', value: 'special' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1 \nOR ${TABLE_NAME}.status IN ($2)`
      );
      expect(values).toEqual([1, 'special']);
    });
  });

  // ============================================================================
  // OR WHERE NOT IN TESTS
  // ============================================================================
  describe('orWheres - OR WHERE NOT IN operator', () => {
    it('should build query with OR WHERE NOT IN clause', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'category', operator: '=', value: 'tech' },
        ],
        orWheres: [
          { column: 'status', operator: 'NOT IN', value: ['deleted', 'banned'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.category = $1 \nOR ${TABLE_NAME}.status NOT IN ($2,$3)`
      );
      expect(values).toEqual(['tech', 'deleted', 'banned']);
    });

    it('should build query with OR WHERE NOT IN with single value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'id', operator: '>', value: 0 },
        ],
        orWheres: [
          { column: 'type', operator: 'NOT IN', value: 'spam' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id > $1 \nOR ${TABLE_NAME}.type NOT IN ($2)`
      );
      expect(values).toEqual([0, 'spam']);
    });

    it('should build query with mixed OR WHERE IN and OR WHERE NOT IN', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'active', operator: '=', value: true },
        ],
        orWheres: [
          { column: 'status', operator: 'IN', value: ['featured', 'promoted'] },
          { column: 'category', operator: 'NOT IN', value: ['spam', 'test'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.active = $1 \nOR ${TABLE_NAME}.status IN ($2,$3) \nOR ${TABLE_NAME}.category NOT IN ($4,$5)`
      );
      expect(values).toEqual([true, 'featured', 'promoted', 'spam', 'test']);
    });
  });

  // ============================================================================
  // SELECT TESTS
  // ============================================================================
  describe('select - Column selection', () => {
    it('should build query with specific columns as array', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'name', 'email'],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email FROM ${TABLE_NAME}`
      );
      expect(values).toEqual([]);
    });

    it('should build query with specific columns as string', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: 'id,name,email',
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.email FROM ${TABLE_NAME}`
      );
      expect(values).toEqual([]);
    });

    it('should build query with table-qualified column names in select', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'users.name', 'orders.total'],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,users.name,orders.total FROM ${TABLE_NAME}`
      );
      expect(values).toEqual([]);
    });

    it('should build query with select and WHERE conditions', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'name', 'status'],
        wheres: [
          { column: 'active', operator: '=', value: true },
        ],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,${TABLE_NAME}.status FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.active = $1`
      );
      expect(values).toEqual([true]);
    });

    it('should default to * when no select is provided', () => {
      const { sql } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'id', operator: '=', value: 1 }],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1`);
    });
  });

  // ============================================================================
  // JOIN TESTS
  // ============================================================================
  describe('join - Table joins', () => {
    it('should build query with INNER JOIN', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id`
      );
      expect(values).toEqual([]);
    });

    it('should build query with LEFT JOIN', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'category_id', foreignTable: 'categories' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nLEFT JOIN categories ON categories.id = ${TABLE_NAME}.category_id`
      );
      expect(values).toEqual([]);
    });

    it('should build query with RIGHT JOIN', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'order_id', foreignTable: 'orders' as any, foreignColumn: 'id', type: 'RIGHT' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nRIGHT JOIN orders ON orders.id = ${TABLE_NAME}.order_id`
      );
      expect(values).toEqual([]);
    });

    it('should build query with FULL JOIN', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'product_id', foreignTable: 'products' as any, foreignColumn: 'id', type: 'FULL' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nFULL JOIN products ON products.id = ${TABLE_NAME}.product_id`
      );
      expect(values).toEqual([]);
    });

    it('should build query with multiple joins', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
          { localColumn: 'category_id', foreignTable: 'categories' as any, foreignColumn: 'id', type: 'LEFT' },
          { localColumn: 'order_id', foreignTable: 'orders' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN categories ON categories.id = ${TABLE_NAME}.category_id \nLEFT JOIN orders ON orders.id = ${TABLE_NAME}.order_id`
      );
      expect(values).toEqual([]);
    });

    it('should build query with chained joins (join referencing another joined table)', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'users.name', 'addresses.city'],
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
          { localColumn: 'users.address_id', foreignTable: 'addresses' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,users.name,addresses.city FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN addresses ON addresses.id = users.address_id`
      );
      expect(values).toEqual([]);
    });
  });

  // ============================================================================
  // COMPLEX COMBINED TESTS
  // ============================================================================
  describe('Complex combinations', () => {
    it('should build query with all options combined', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'name', 'users.email', 'categories.name'],
        wheres: [
          { column: 'status', operator: '=', value: 'active' },
          { column: 'category_id', operator: 'IN', value: [1, 2, 3] },
        ],
        orWheres: [
          { column: 'role', operator: '=', value: 'admin' },
          { column: 'priority', operator: 'NOT IN', value: ['low', 'none'] },
        ],
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
          { localColumn: 'category_id', foreignTable: 'categories' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name,users.email,categories.name FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN categories ON categories.id = ${TABLE_NAME}.category_id \nWHERE ${TABLE_NAME}.status = $1 \nAND ${TABLE_NAME}.category_id IN ($2,$3,$4) \nOR ${TABLE_NAME}.role = $5 \nOR ${TABLE_NAME}.priority NOT IN ($6,$7)`
      );
      expect(values).toEqual(['active', 1, 2, 3, 'admin', 'low', 'none']);
    });

    it('should build query matching real-world scenario: user posts with filters', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'title', 'content', 'users.name', 'categories.name'],
        wheres: [
          { column: 'published', operator: '=', value: true },
          { column: 'deleted_at', operator: 'IS', value: null },
          { column: 'status', operator: 'IN', value: ['published', 'featured'] },
        ],
        orWheres: [
          { column: 'users.role', operator: '=', value: 'admin' },
        ],
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
          { localColumn: 'category_id', foreignTable: 'categories' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.title,${TABLE_NAME}.content,users.name,categories.name FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id \nLEFT JOIN categories ON categories.id = ${TABLE_NAME}.category_id \nWHERE ${TABLE_NAME}.published = $1 \nAND ${TABLE_NAME}.deleted_at IS NULL \nAND ${TABLE_NAME}.status IN ($2,$3) \nOR users.role = $4`
      );
      expect(values).toEqual([true, 'published', 'featured', 'admin']);
    });

    it('should build query matching real-world scenario: order filtering with exclusions', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'total', 'status', 'customers.name', 'products.title'],
        wheres: [
          { column: 'total', operator: '>=', value: 100 },
          { column: 'status', operator: 'NOT IN', value: ['cancelled', 'refunded', 'disputed'] },
          { column: 'created_at', operator: '>=', value: '2024-01-01' },
        ],
        orWheres: [
          { column: 'priority', operator: '=', value: 'high' },
          { column: 'customers.vip', operator: '=', value: true },
        ],
        join: [
          { localColumn: 'customer_id', foreignTable: 'customers' as any, foreignColumn: 'id', type: 'INNER' },
          { localColumn: 'product_id', foreignTable: 'products' as any, foreignColumn: 'id', type: 'LEFT' },
        ],
      });

      expect(sql).toBe(
        `SELECT ${TABLE_NAME}.id,${TABLE_NAME}.total,${TABLE_NAME}.status,customers.name,products.title FROM ${TABLE_NAME} \nINNER JOIN customers ON customers.id = ${TABLE_NAME}.customer_id \nLEFT JOIN products ON products.id = ${TABLE_NAME}.product_id \nWHERE ${TABLE_NAME}.total >= $1 \nAND ${TABLE_NAME}.status NOT IN ($2,$3,$4) \nAND ${TABLE_NAME}.created_at >= $5 \nOR ${TABLE_NAME}.priority = $6 \nOR customers.vip = $7`
      );
      expect(values).toEqual([100, 'cancelled', 'refunded', 'disputed', '2024-01-01', 'high', true]);
    });

    it('should build query with empty options', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({});

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME}`);
      expect(values).toEqual([]);
    });

    it('should build query with only select (no wheres, no joins)', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        select: ['id', 'name'],
      });

      expect(sql).toBe(`SELECT ${TABLE_NAME}.id,${TABLE_NAME}.name FROM ${TABLE_NAME}`);
      expect(values).toEqual([]);
    });

    it('should build query with only joins (no wheres, no select)', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [
          { localColumn: 'user_id', foreignTable: 'users' as any, foreignColumn: 'id', type: 'INNER' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nINNER JOIN users ON users.id = ${TABLE_NAME}.user_id`
      );
      expect(values).toEqual([]);
    });

    it('should maintain correct parameter positions with complex conditions', () => {
      const { sql, values, valuesPosition } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'col1', operator: '=', value: 'val1' },
          { column: 'col2', operator: 'IN', value: ['a', 'b', 'c'] },
          { column: 'col3', operator: '=', value: 'val3' },
          { column: 'col4', operator: 'NOT IN', value: [1, 2] },
        ],
        orWheres: [
          { column: 'col5', operator: '=', value: 'val5' },
          { column: 'col6', operator: 'IN', value: ['x', 'y'] },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.col1 = $1 \nAND ${TABLE_NAME}.col2 IN ($2,$3,$4) \nAND ${TABLE_NAME}.col3 = $5 \nAND ${TABLE_NAME}.col4 NOT IN ($6,$7) \nOR ${TABLE_NAME}.col5 = $8 \nOR ${TABLE_NAME}.col6 IN ($9,$10)`
      );
      expect(values).toEqual(['val1', 'a', 'b', 'c', 'val3', 1, 2, 'val5', 'x', 'y']);
      expect(valuesPosition).toBe(10);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge cases', () => {
    it('should handle empty wheres array', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME}`);
      expect(values).toEqual([]);
    });

    it('should handle empty orWheres array', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'id', operator: '=', value: 1 }],
        orWheres: [],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.id = $1`);
      expect(values).toEqual([1]);
    });

    it('should handle empty join array', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        join: [],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME}`);
      expect(values).toEqual([]);
    });

    it('should handle empty string value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'name', operator: '=', value: '' }],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.name = $1`);
      expect(values).toEqual(['']);
    });

    it('should handle zero as value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'count', operator: '=', value: 0 }],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.count = $1`);
      expect(values).toEqual([0]);
    });

    it('should handle false boolean as value', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'active', operator: '=', value: false }],
      });

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.active = $1`);
      expect(values).toEqual([false]);
    });

    it('should handle special characters in string values', () => {
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [
          { column: 'name', operator: 'LIKE', value: "%O'Brien%" },
          { column: 'code', operator: '=', value: 'ABC-123_xyz!@#$%' },
        ],
      });

      expect(sql).toBe(
        `SELECT * FROM ${TABLE_NAME} \nWHERE ${TABLE_NAME}.name LIKE $1 \nAND ${TABLE_NAME}.code = $2`
      );
      expect(values).toEqual(["%O'Brien%", 'ABC-123_xyz!@#$%']);
    });

    it('should handle large IN clause', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
      const { sql, values } = repository.buildAndGetSelectQuery({
        wheres: [{ column: 'id', operator: 'IN', value: largeArray }],
      });

      expect(values).toEqual(largeArray);
      expect(values.length).toBe(100);
      expect(sql).toContain('IN (');
      expect(sql.match(/\$\d+/g)?.length).toBe(100);
    });

    it('should handle undefined options gracefully', () => {
      const { sql, values } = repository.buildAndGetSelectQuery(undefined);

      expect(sql).toBe(`SELECT * FROM ${TABLE_NAME}`);
      expect(values).toEqual([]);
    });

    it('should throw error when using array value with = operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'status', operator: '=', value: ['active', 'pending'] }],
        });
      }).toThrow('Operator: = is not compatible with array values: active,pending');
    });

    it('should throw error when using array value with != operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'status', operator: '!=', value: ['deleted', 'archived'] }],
        });
      }).toThrow('Operator: != is not compatible with array values: deleted,archived');
    });

    it('should throw error when using array value with > operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'age', operator: '>', value: [18, 21] }],
        });
      }).toThrow('Operator: > is not compatible with array values: 18,21');
    });

    it('should throw error when using array value with LIKE operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'name', operator: 'LIKE', value: ['%john%', '%jane%'] }],
        });
      }).toThrow('Operator: LIKE is not compatible with array values: %john%,%jane%');
    });

    it('should NOT throw error when using array value with IN operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'status', operator: 'IN', value: ['active', 'pending'] }],
        });
      }).not.toThrow();
    });

    it('should NOT throw error when using array value with NOT IN operator', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'status', operator: 'NOT IN', value: ['deleted', 'archived'] }],
        });
      }).not.toThrow();
    });

    it('should throw error when using array value with = operator in orWheres', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'id', operator: '=', value: 1 }],
          orWheres: [{ column: 'status', operator: '=', value: ['active', 'pending'] }],
        });
      }).toThrow('Operator: = is not compatible with array values: active,pending');
    });

    it('should throw error when using array value with LIKE operator in orWheres', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          orWheres: [{ column: 'name', operator: 'LIKE', value: ['%john%', '%jane%'] }],
        });
      }).toThrow('Operator: LIKE is not compatible with array values: %john%,%jane%');
    });

    it('should NOT throw error when using array value with IN operator in orWheres', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          wheres: [{ column: 'id', operator: '=', value: 1 }],
          orWheres: [{ column: 'status', operator: 'IN', value: ['active', 'pending'] }],
        });
      }).not.toThrow();
    });

    it('should NOT throw error when using array value with NOT IN operator in orWheres', () => {
      expect(() => {
        repository.buildAndGetSelectQuery({
          orWheres: [{ column: 'status', operator: 'NOT IN', value: ['deleted', 'archived'] }],
        });
      }).not.toThrow();
    });
  });
});

// ============================================================================
// OWNED WRITES (sortable modules): updatePositionsForOwner / updateStatusForOwner
// ============================================================================
class OwnedWriteRepository extends BaseRepository {
  constructor(tableName: any) {
    super(tableName);
  }
  public positions(...args: Parameters<BaseRepository['updatePositionsForOwner']>) {
    return this.updatePositionsForOwner(...args);
  }
  public status(...args: Parameters<BaseRepository['updateStatusForOwner']>) {
    return this.updateStatusForOwner(...args);
  }
  public seo(column: string) {
    return this.seoFreshnessSet(column);
  }
}

describe('BaseRepository - owned writes', () => {
  let repository: OwnedWriteRepository;
  let queryMock: jest.Mock;
  const squash = (sql: string) => sql.replace(/\s+/g, ' ').trim();
  const SEO_CASE =
    'seo_generated_at = CASE WHEN t.seo_generated_at IS NOT NULL AND t.seo_generated_at >= t.updated_at THEN CURRENT_TIMESTAMP ELSE t.seo_generated_at END';

  beforeEach(async () => {
    jest.clearAllMocks();
    const { initClient, getClient } = require('../client');
    await initClient({
      host: 'localhost',
      port: 5432,
      username: 'u',
      password: 'p',
      database: 'd',
      client: 'postgres',
    });
    queryMock = getClient().query as jest.Mock;
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
    repository = new OwnedWriteRepository('portfolios' as any);
  });

  afterEach(async () => {
    const { killClient } = require('../client');
    await killClient();
  });

  describe('updatePositionsForOwner', () => {
    const items = [
      { module_id: 11, position: 1 },
      { module_id: 12, position: 0 },
    ];

    it('AC-6: issues exactly ONE query, guarded by the owner, with IS DISTINCT FROM, all values bound', async () => {
      queryMock.mockResolvedValue({ rows: [], rowCount: 2 });
      const count = await repository.positions(7, items);

      expect(count).toBe(2);
      expect(queryMock).toHaveBeenCalledTimes(1);
      const [sql, values] = queryMock.mock.calls[0];
      const text = squash(sql);
      expect(text).toMatch(/^UPDATE portfolios AS t SET position = v\.position/);
      expect(text).toContain('FROM unnest($1::int[], $2::int[]) AS v(id, position)');
      expect(text).toContain('t.id = v.id');
      expect(text).toContain('t.user_id = $3');
      expect(text).toContain('t.position IS DISTINCT FROM v.position');
      expect(values).toEqual([[11, 12], [1, 0], 7]);
    });

    it('AC-6: ids, positions and the owner are bound, never interpolated into the SQL text', async () => {
      await repository.positions(424242, [{ module_id: 987654, position: 135 }]);
      const [sql] = queryMock.mock.calls[0];
      expect(sql).not.toContain('424242');
      expect(sql).not.toContain('987654');
      expect(sql).not.toMatch(/\b135\b/);
    });

    it('AC-7: without seoStampColumn there is no CASE; with it the SEO stamp is carried forward only when fresh', async () => {
      await repository.positions(7, items);
      expect(squash(queryMock.mock.calls[0][0])).not.toContain('CASE');

      queryMock.mockClear();
      await repository.positions(7, items, { seoStampColumn: 'seo_generated_at' });
      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(squash(queryMock.mock.calls[0][0])).toContain(SEO_CASE);
    });

    it('AC-6: honours a custom owner column', async () => {
      await repository.positions(7, items, { ownerColumn: 'artist_id' });
      expect(squash(queryMock.mock.calls[0][0])).toContain('t.artist_id = $3');
    });

    it('AC-6: an empty list does no query and returns 0', async () => {
      await expect(repository.positions(7, [])).resolves.toBe(0);
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('AC-6: unsafe identifiers are refused before any query', async () => {
      await expect(
        repository.positions(7, items, { ownerColumn: 'user_id = 1 OR 1=1; --' }),
      ).rejects.toThrow();
      await expect(
        repository.positions(7, items, { seoStampColumn: 'x; DROP TABLE users' }),
      ).rejects.toThrow();
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('AC-6: returns 0 when the driver reports no rowCount', async () => {
      queryMock.mockResolvedValue({ rows: [] });
      await expect(repository.positions(7, items)).resolves.toBe(0);
    });
  });

  describe('updateStatusForOwner', () => {
    it('AC-13: only the sent column appears in SET and in the change filter', async () => {
      queryMock.mockResolvedValue({ rows: [{ id: 5, is_highlight: false, is_active: false }], rowCount: 1 });
      const out = await repository.status(5, 7, { is_active: false });

      expect(out).toEqual({ id: 5, is_highlight: false, is_active: false });
      expect(queryMock).toHaveBeenCalledTimes(1);
      const [sql, values] = queryMock.mock.calls[0];
      const text = squash(sql);
      expect(text).toContain('SET is_active = $3');
      expect(text.slice(0, text.indexOf('WHERE'))).not.toContain('is_highlight');
      expect(text).toContain('WHERE t.id = $1 AND t.user_id = $2 AND (t.is_active IS DISTINCT FROM $3)');
      expect(text).toContain('RETURNING t.id, t.is_highlight, t.is_active');
      expect(values).toEqual([5, 7, false]);
    });

    it('AC-13: both columns are written together, bound in order, filtered with OR', async () => {
      queryMock.mockResolvedValue({ rows: [{ id: 5, is_highlight: true, is_active: false }], rowCount: 1 });
      await repository.status(5, 7, { is_highlight: true, is_active: false });
      const [sql, values] = queryMock.mock.calls[0];
      const text = squash(sql);
      expect(text).toContain('SET is_highlight = $3, is_active = $4');
      expect(text).toContain('(t.is_highlight IS DISTINCT FROM $3 OR t.is_active IS DISTINCT FROM $4)');
      expect(values).toEqual([5, 7, true, false]);
    });

    it('AC-13: an undefined key is never written (no NULL); an input with no keys does no query and returns null', async () => {
      await expect(repository.status(5, 7, { is_highlight: undefined, is_active: undefined })).resolves.toBeNull();
      expect(queryMock).not.toHaveBeenCalled();

      await repository.status(5, 7, { is_highlight: undefined, is_active: true });
      const [sql, values] = queryMock.mock.calls[0];
      const text = squash(sql);
      expect(text.slice(0, text.indexOf('WHERE'))).not.toContain('is_highlight = ');
      expect(values).toEqual([5, 7, true]);
    });

    it('AC-13: arbitrary extra keys on the input never reach the SQL text', async () => {
      await repository.status(5, 7, { is_active: true, role: 'admin', 'x = 1; --': 1 } as any);
      const [sql, values] = queryMock.mock.calls[0];
      expect(sql).not.toContain('role');
      expect(sql).not.toContain('admin');
      expect(sql).not.toContain('--');
      expect(values).toEqual([5, 7, true]);
    });

    it('AC-17: returns null when nothing matched or nothing would change (zero rows)', async () => {
      queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
      await expect(repository.status(5, 7, { is_active: true })).resolves.toBeNull();
    });

    it('AC-7/AC-17: the SEO CASE appears only when seoStampColumn is given, in SET of the same single statement', async () => {
      await repository.status(5, 7, { is_active: true });
      expect(squash(queryMock.mock.calls[0][0])).not.toContain('CASE');

      queryMock.mockClear();
      await repository.status(5, 7, { is_active: true }, { seoStampColumn: 'seo_generated_at' });
      expect(queryMock).toHaveBeenCalledTimes(1);
      const text = squash(queryMock.mock.calls[0][0]);
      expect(text).toContain(SEO_CASE);
      expect(text.indexOf('CASE')).toBeLessThan(text.indexOf('WHERE'));
    });

    it('AC-6: the owner guard is always present and bound', async () => {
      await repository.status(5, 7, { is_highlight: true });
      const [sql, values] = queryMock.mock.calls[0];
      expect(squash(sql)).toContain('t.user_id = $2');
      expect(values[1]).toBe(7);
    });

    it('AC-6: unsafe identifiers are refused before any query', async () => {
      await expect(repository.status(5, 7, { is_active: true }, { ownerColumn: '1; DROP' })).rejects.toThrow();
      expect(queryMock).not.toHaveBeenCalled();
    });
  });

  describe('seoFreshnessSet', () => {
    it('AC-7: keeps a fresh stamp fresh (CURRENT_TIMESTAMP) and leaves a stale or null one as is', () => {
      expect(repository.seo('seo_generated_at')).toBe(SEO_CASE);
    });
    it('AC-7: rejects unsafe column names', () => {
      expect(() => repository.seo('a b')).toThrow();
    });
  });
});
