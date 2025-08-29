import { QueryBuilder } from '../queryBuilder';
import { ClientNotInitializedException } from '../exceptions';
import { FullDatabaseConfig } from '../types';

// Mock the client module
jest.mock('../clients', () => {
  let mockClient: any = null;
  
  return {
    __esModule: true,
    get default() {
      return mockClient;
    },
    initClient: jest.fn(() => {
        if(mockClient) return mockClient;
      mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
      };
      return mockClient;
    }),
    killClient: jest.fn(() => {
      mockClient = null;
    }),
  };
});

describe('QueryBuilder', () => {
  let mockClient: any;
  let testConfig: FullDatabaseConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup test configuration
    testConfig = {
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
      client: 'postgres' as const,
    };

    // Get the mocked client
   
    const { initClient } = require('../clients');
    initClient(testConfig);
    mockClient = require('../clients').default;
  });

  afterEach(async () => {
    // Clean up after each test
    const { killClient } = require('../clients');
    killClient();
  });

  describe('Client Initialization', () => {
    it('should initialize with a valid client', () => {
      // Arrange
     
      // Act & Assert
      expect(() => new QueryBuilder('test_table')).not.toThrow();
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should call connect method on client during initialization', () => {
      // Arrange
      const { initClient } = require('../clients');
      initClient(testConfig);
      
      // Act
      new QueryBuilder('test_table');
      
      // Assert
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Building', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(() => {
      const { initClient } = require('../clients');
      initClient(testConfig);
      queryBuilder = new QueryBuilder('test_table');
    });

    it('should build basic SELECT query with default select', () => {
      // Act
      queryBuilder.select();
      
      // Assert
      expect(queryBuilder['_select']).toBe('*');
    });

    it('should build SELECT query with specific columns', () => {
      // Act
      queryBuilder.select(['id', 'name', 'email']);
      
      // Assert
      expect(queryBuilder['_select']).toBe('id,name,email');
    });

    it('should add WHERE conditions correctly', () => {
      // Act
      queryBuilder.where('id', '=', '1');
      queryBuilder.where('status', '=', 'active');
      
      // Assert
      expect(queryBuilder['_wheres']).toHaveLength(2);
      expect(queryBuilder['_wheres'][0]).toBe('id = 1');
      expect(queryBuilder['_wheres'][1]).toBe('status = active');
    });

    it('should add OR WHERE conditions correctly', () => {
      // Act
      queryBuilder.orWhere('status', '=', 'active');
      queryBuilder.orWhere('status', '=', 'pending');
      
      // Assert
      expect(queryBuilder['_orWheres']).toHaveLength(2);
      expect(queryBuilder['_orWheres'][0]).toBe('status = active');
      expect(queryBuilder['_orWheres'][1]).toBe('status = pending');
    });

    it('should build complete query with WHERE conditions', () => {
      // Arrange
      queryBuilder.select(['id', 'name']);
      queryBuilder.where('status', '=', 'active');
      queryBuilder.where('age', '>', '18');
      
      // Act
      queryBuilder['buildSelectQuery']();
      
      // Assert
      expect(queryBuilder.query).toBe('SELECT id,name FROM test_table WHERE status = active AND age > 18');
    });

    it('should build complete query with OR WHERE conditions', () => {
      // Arrange
      queryBuilder.select(['id', 'name']);
      queryBuilder.orWhere('status', '=', 'active');
      queryBuilder.orWhere('status', '=', 'pending');
      
      // Act
      queryBuilder['buildSelectQuery']();
      
      // Assert
      expect(queryBuilder.query).toBe('SELECT id,name FROM test_table OR status = active OR status = pending');
    });

    it('should build complete query with both WHERE and OR WHERE conditions', () => {
      // Arrange
      queryBuilder.select(['id', 'name']);
      queryBuilder.where('age', '>', '18');
      queryBuilder.orWhere('status', '=', 'active');
      queryBuilder.orWhere('status', '=', 'pending');
      
      // Act
      queryBuilder['buildSelectQuery']();
      
      // Assert
      expect(queryBuilder.query).toBe('SELECT id,name FROM test_table WHERE age > 18 OR status = active OR status = pending');
    });
  });

  describe('Query Execution', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(() => {
      const { initClient } = require('../clients');
      initClient(testConfig);
      queryBuilder = new QueryBuilder('test_table');
    });

    it('should execute get() method and call client query', async () => {
      // Arrange
      const mockResult = [{ id: 1, name: 'Test' }];
      mockClient.query.mockResolvedValue(mockResult);
      
      // Act
      const result = await queryBuilder.get();
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(queryBuilder.query);
      expect(result).toEqual(mockResult);
    });

    it('should execute raw() method with custom query', async () => {
      // Arrange
      const customQuery = 'SELECT COUNT(*) FROM test_table';
      const mockResult = [{ count: 5 }];
      mockClient.query.mockResolvedValue(mockResult);
      
      // Act
      const result = await queryBuilder.raw(customQuery);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(customQuery);
      expect(result).toEqual(mockResult);
    });

   
  });

  describe('Method Chaining', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(() => {
      const { initClient } = require('../clients');
      initClient(testConfig);
      queryBuilder = new QueryBuilder('test_table');
    });

    it('should support method chaining for select', () => {
      // Act & Assert
      expect(queryBuilder.select(['id', 'name'])).toBe(queryBuilder);
    });

    it('should support method chaining for where', () => {
      // Act & Assert
      expect(queryBuilder.where('id', '=', '1')).toBe(queryBuilder);
    });

    it('should support method chaining for orWhere', () => {
      // Act & Assert
      expect(queryBuilder.orWhere('status', '=', 'active')).toBe(queryBuilder);
    });

    it('should support complex method chaining', () => {
      // Act & Assert
      const result = queryBuilder
        .select(['id', 'name', 'email'])
        .where('status', '=', 'active')
        .where('age', '>', '18')
        .orWhere('role', '=', 'admin');
      
      expect(result).toBe(queryBuilder);
      expect(queryBuilder['_select']).toBe('id,name,email');
      expect(queryBuilder['_wheres']).toHaveLength(2);
      expect(queryBuilder['_orWheres']).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty select values array', () => {
      // Arrange
      const { initClient } = require('../clients');
      initClient(testConfig);
      const queryBuilder = new QueryBuilder('test_table');
      
      // Act
      queryBuilder.select([]);
      
      // Assert
      expect(queryBuilder['_select']).toBe('*');
    });

    it('should handle single select value', () => {
      // Arrange
      const { initClient } = require('../clients');
      initClient(testConfig);
      const queryBuilder = new QueryBuilder('test_table');
      
      // Act
      queryBuilder.select(['id']);
      
      // Assert
      expect(queryBuilder['_select']).toBe('id');
    });

    it('should build query without WHERE conditions', () => {
      // Arrange
      const { initClient } = require('../clients');
      initClient(testConfig);
      const queryBuilder = new QueryBuilder('test_table');
      queryBuilder.select(['id', 'name']);
      
      // Act
      queryBuilder['buildSelectQuery']();
      
      // Assert
      expect(queryBuilder.query).toBe('SELECT id,name FROM test_table');
    });
  });

  describe('Error Handling', () => {
    it('should throw ClientNotInitializedException when client is not available', () => {
      // Arrange - Kill the client to make it null
      const { killClient } = require('../clients');
      killClient();
      
      // Act & Assert
      expect(() => new QueryBuilder('test_table')).toThrow(ClientNotInitializedException);
    });
  });
});
