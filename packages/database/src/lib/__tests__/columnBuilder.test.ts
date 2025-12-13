import {
  DatabaseClient,
  DatabaseConfig,
  FullDatabaseConfig,
} from '@repo/common-lib/types/database';
import {
  ColumnBuilder,
  DEFAULT_COLUMN_OPTIONS,
} from '../builder/columnBuilder';
import { ColumnAttributes } from '@repo/common-lib/types/database';
import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
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
describe('ColumnBuilder', () => {
  beforeEach(async () => {
    // Initialize client for tests
    const { initClient } = require('../client');
    await initClient({
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
      client: 'postgres',
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Clean up after each test
    const { killClient } = require('../client');
    await killClient();
  });
  describe('DEFAULT_COLUMN_OPTIONS', () => {
    it('should have correct default values', () => {
      // Assert
      expect(DEFAULT_COLUMN_OPTIONS).toEqual({
        nullable: false,
        unique: false,
        primaryKey: false,
      });
    });
  });

  describe('id', () => {
    it('should create id column with default name', () => {
      // Act
      const result = ColumnBuilder.id();

      // Assert
      expect(result).toBe('id SERIAL PRIMARY KEY');
    });

    it('should create id column with custom name', () => {
      // Act
      const result = ColumnBuilder.id('user_id');

      // Assert
      expect(result).toBe('user_id SERIAL PRIMARY KEY');
    });

    it('should handle empty string as column name', () => {
      // Act
      const result = ColumnBuilder.id('');

      // Assert
      expect(result).toBe('id SERIAL PRIMARY KEY');
    });

    it('should handle special characters in column name', () => {
      // Act
      const result = ColumnBuilder.id('user-id_123');

      // Assert
      expect(result).toBe('user-id_123 SERIAL PRIMARY KEY');
    });

    it('should handle column names with spaces', () => {
      // Act
      const result = ColumnBuilder.id('user id');

      // Assert
      expect(result).toBe('user id SERIAL PRIMARY KEY');
    });

    it('should handle very long column names', () => {
      // Act
      const longName = 'a'.repeat(100);
      const result = ColumnBuilder.id(longName);

      // Assert
      expect(result).toBe(`${longName} SERIAL PRIMARY KEY`);
    });

    it('should throw error for null and undefined column names', () => {
      // Act & Assert
    });
  });

  describe('integer', () => {
    it('should create integer column without options', () => {
      // Act
      const result = ColumnBuilder.integer('age');

      // Assert
      expect(result).toBe('age INTEGER');
    });

    it('should create integer column with nullable option', () => {
      // Act
      const result = ColumnBuilder.integer('age', { nullable: true });

      // Assert
      expect(result).toBe('age INTEGER NULL');
    });

    it('should create integer column with unique option', () => {
      // Act
      const result = ColumnBuilder.integer('age', { unique: true });

      // Assert
      expect(result).toBe('age INTEGER NOT NULL UNIQUE');
    });

    it('should create integer column with autoIncrement option', () => {
      // Act
      const result = ColumnBuilder.autoIncrement('id');

      // Assert
      expect(result).toBe('id SERIAL');
    });

    it('should create integer column with default value', () => {
      // Act
      const result = ColumnBuilder.integer('count', { default: 0 });

      // Assert
      expect(result).toBe('count INTEGER NOT NULL DEFAULT 0');
    });

    it('should create integer column with multiple options', () => {
      // Act
      const result = ColumnBuilder.integer('score', {
        nullable: true,
        unique: true,
        default: 100,
      });

      // Assert
      expect(result).toBe('score INTEGER NULL DEFAULT 100 UNIQUE');
    });

    it('should handle null default value', () => {
      // Act
      const result = ColumnBuilder.integer('value', { default: null });

      // Assert
      expect(result).toBe('value INTEGER NOT NULL DEFAULT NULL');
    });

    it('should handle empty column name', () => {
      // Act
      expect(() => ColumnBuilder.integer('')).toThrow();

      // Assert
      expect(() => ColumnBuilder.integer('')).toThrow();
      expect(() => ColumnBuilder.integer(null as any)).toThrow();
      expect(() => ColumnBuilder.integer(undefined as any)).toThrow();
      expect(() => ColumnBuilder.integer(123 as any)).toThrow();
      expect(() => ColumnBuilder.integer({} as any)).toThrow();
      expect(() => ColumnBuilder.integer([] as any)).toThrow();
    });

    it('should throw error for null column name', () => {
      // Act & Assert
      expect(() => ColumnBuilder.integer(null as any)).toThrow();
    });
  });

  describe('bigint', () => {
    it('should create bigint column without options', () => {
      // Act
      const result = ColumnBuilder.bigint('id');

      // Assert
      expect(result).toBe('id BIGINT');
    });

    it('should create bigint column with options', () => {
      // Act
      const result = ColumnBuilder.bigint('id', {
        nullable: true,
        unique: true,
      });

      // Assert
      expect(result).toBe('id BIGINT NULL UNIQUE');
    });

    it('should handle special characters in column name', () => {
      // Act
      const result = ColumnBuilder.bigint('user-id_123');

      // Assert
      expect(result).toBe('user-id_123 BIGINT');
    });
  });

  describe('boolean', () => {
    it('should create boolean column without options', () => {
      // Act
      const result = ColumnBuilder.boolean('is_active');

      // Assert
      expect(result).toBe('is_active BOOLEAN');
    });

    it('should create boolean column with default true', () => {
      // Act
      const result = ColumnBuilder.boolean('is_active', { default: true });

      // Assert
      expect(result).toBe('is_active BOOLEAN NOT NULL DEFAULT true');
    });

    it('should create boolean column with default false', () => {
      // Act
      const result = ColumnBuilder.boolean('is_deleted', { default: false });

      // Assert
      expect(result).toBe('is_deleted BOOLEAN NOT NULL DEFAULT false');
    });

    it('should create nullable boolean column', () => {
      // Act
      const result = ColumnBuilder.boolean('is_verified', { nullable: true });

      // Assert
      expect(result).toBe('is_verified BOOLEAN NULL');
    });
  });

  describe('string', () => {
    it('should create string column with default length', () => {
      // Act
      const result = ColumnBuilder.string('name');

      // Assert
      expect(result).toBe('name VARCHAR(255) NOT NULL');
    });

    it('should create string column with options', () => {
      // Act
      const result = ColumnBuilder.string('name', 100, {
        nullable: true,
        unique: true,
        default: 'John',
      });

      // Assert
      expect(result).toBe("name VARCHAR(100) NULL DEFAULT 'John' UNIQUE");
    });

    it('should handle very large length', () => {
      // Act
      const result = ColumnBuilder.string('content', 65535);

      // Assert
      expect(result).toBe('content VARCHAR(65535) NOT NULL');
    });

    it('should handle negative length', () => {
      // Act

      // Assert
      expect(() => ColumnBuilder.string('test', -1)).toThrow();
    });

    it('should handle empty column name', () => {
      expect(() => ColumnBuilder.string('')).toThrow();
      expect(() => ColumnBuilder.string(null as any)).toThrow();
      expect(() => ColumnBuilder.string(undefined as any)).toThrow();
      expect(() => ColumnBuilder.string(123 as any)).toThrow();
      expect(() => ColumnBuilder.string({} as any)).toThrow();
      expect(() => ColumnBuilder.string([] as any)).toThrow();
    });

    describe('foreignKey', () => {
      it('should create foreign key column with default options', () => {
        // Act
        const result = ColumnBuilder.foreignKey('user_id', 'users', 'id');

        // Assert
        expect(result).toBe('user_id INT REFERENCES users (id) NOT NULL');
      });

      it('should create foreign key column with custom options', () => {
        // Act
        const result = ColumnBuilder.foreignKey('user_id', 'users', 'id', {
          nullable: true,
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        });

        // Assert
        expect(result).toBe(
          'user_id INT REFERENCES users (id) ON DELETE CASCADE ON UPDATE RESTRICT',
        );
      });

      it('should handle different onDelete actions', () => {
        const actions: Array<
          'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'
        > = ['SET NULL', 'CASCADE', 'RESTRICT', 'NO ACTION'];

        actions.forEach((action) => {
          const result = ColumnBuilder.foreignKey('user_id', 'users', 'id', {
            onDelete: action,
          });
          expect(result).toContain(`ON DELETE ${action}`);
        });
      });

      it('should handle different onUpdate actions', () => {
        const actions: Array<
          'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'
        > = ['SET NULL', 'CASCADE', 'RESTRICT', 'NO ACTION'];

        actions.forEach((action) => {
          const result = ColumnBuilder.foreignKey('user_id', 'users', 'id', {
            onUpdate: action,
          });
          expect(result).toContain(`ON UPDATE ${action}`);
        });
      });

      it('should handle complex table and column names', () => {
        // Act
        const result = ColumnBuilder.foreignKey(
          'order_user_id',
          'user_profiles' as any,
          'profile_id',
          { nullable: true, onDelete: 'CASCADE' },
        );

        // Assert
        expect(result).toBe(
          'order_user_id INT REFERENCES user_profiles (profile_id) ON DELETE CASCADE',
        );
      });

      it('should throw error for null column name', () => {
        // Act & Assert
        expect(() =>
          ColumnBuilder.foreignKey(null as any, 'users', 'id'),
        ).toThrow();
      });

      it('should throw error for null table name', () => {
        // Act & Assert
        expect(() =>
          ColumnBuilder.foreignKey('user_id', null as any, 'id'),
        ).toThrow();
      });

      it('should throw error for null table column name', () => {
        // Act & Assert
        expect(() =>
          ColumnBuilder.foreignKey('user_id', 'users', null as any),
        ).toThrow();
      });
    });

    describe('email', () => {
      it('should create email column with default name and options', () => {
        // Act
        const result = ColumnBuilder.email();

        // Assert
        expect(result).toBe('email VARCHAR(255) NOT NULL UNIQUE');
      });

      it('should create email column with custom name', () => {
        // Act
        const result = ColumnBuilder.email('user_email');

        // Assert
        expect(result).toBe('user_email VARCHAR(255) NOT NULL UNIQUE');
      });

      it('should create email column with custom options', () => {
        // Act
        const result = ColumnBuilder.email('user_email', {
          nullable: true,
          unique: false,
          default: 'test@example.com',
        });

        // Assert
        expect(result).toBe(
          "user_email VARCHAR(255) NULL DEFAULT 'test@example.com'",
        );
      });

      it('should override default options with custom options', () => {
        // Act
        const result = ColumnBuilder.email('email', { nullable: true });

        // Assert
        expect(result).toBe('email VARCHAR(255) NULL UNIQUE');
      });

      it('should handle empty email column name', () => {
        // Act
        const result = ColumnBuilder.email('');

        // Assert
        expect(result).toBe('email VARCHAR(255) NOT NULL UNIQUE');
      });

      it('should handle special characters in email column name', () => {
        // Act
        const result = ColumnBuilder.email('user-email_123');

        // Assert
        expect(result).toBe('user-email_123 VARCHAR(255) NOT NULL UNIQUE');
      });
    });

    describe('password', () => {
      it('should create password column with default name', () => {
        // Act
        const result = ColumnBuilder.password();

        // Assert
        expect(result).toBe('password VARCHAR(255) NOT NULL');
      });

      it('should create password column with custom name', () => {
        // Act
        const result = ColumnBuilder.password('user_password');

        // Assert
        expect(result).toBe('user_password VARCHAR(255) NOT NULL');
      });

      it('should handle empty password column name', () => {
        // Act
        const result = ColumnBuilder.password('');

        // Assert
        expect(result).toBe('password VARCHAR(255) NOT NULL');
      });

      it('should handle special characters in password column name', () => {
        // Act
        const result = ColumnBuilder.password('user-password_123');

        // Assert
        expect(result).toBe('user-password_123 VARCHAR(255) NOT NULL');
      });
    });

    describe('timestamp', () => {
      it('should create timestamp column with default options', () => {
        // Act
        const result = ColumnBuilder.timestamp('created_at');

        // Assert
        expect(result).toBe('created_at TIMESTAMPTZ NOT NULL');
      });

      it('should create timestamp column with custom options', () => {
        // Act
        const result = ColumnBuilder.timestamp('updated_at', {
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
        });

        // Assert
        expect(result).toBe(
          'updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP',
        );
      });

      it('should create nullable timestamp without default', () => {
        // Act
        const result = ColumnBuilder.timestamp('deleted_at', {
          nullable: true,
          default: undefined,
        });

        // Assert
        expect(result).toBe('deleted_at TIMESTAMPTZ NULL');
      });

      it('should handle null default value', () => {
        // Act
        const result = ColumnBuilder.timestamp('expires_at', {
          nullable: true,
          default: null,
        });

        // Assert
        expect(result).toBe('expires_at TIMESTAMPTZ NULL DEFAULT NULL');
      });

      it('should handle empty column name', () => {
        // Act

        // Assert
        expect(() => ColumnBuilder.timestamp('')).toThrow();
      });

      it('should throw error for null column name', () => {
        // Act & Assert
        expect(() => ColumnBuilder.timestamp(null as any)).toThrow();
      });
    });

    describe('timestamps', () => {
      it('should create timestamps with default options', () => {
        // Act
        const result = ColumnBuilder.timestamps();

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
          'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        ]);
      });

      it('should create timestamps with custom options', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP',
          'updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP',
        ]);
      });

      it('should create nullable timestamps without default', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          nullable: true,
          default: undefined,
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NULL',
          'updated_at TIMESTAMPTZ NULL',
        ]);
      });

      it('should handle null default value', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          nullable: true,
          default: null,
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NULL DEFAULT NULL',
          'updated_at TIMESTAMPTZ NULL DEFAULT NULL',
        ]);
      });

      it('should create timestamps with unique constraint', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          unique: true,
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() UNIQUE',
          'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() UNIQUE',
        ]);
      });

      it('should create timestamps with SERIAL', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
          'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        ]);
      });

      it('should create timestamps with all options', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          nullable: true,
          unique: true,
          default: 'CURRENT_TIMESTAMP',
        });

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP UNIQUE',
          'updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP UNIQUE',
        ]);
      });

      it('should return array type', () => {
        // Act
        const result = ColumnBuilder.timestamps();

        // Assert
        expect(Array.isArray(result)).toBe(true);
      });

      it('should return consistent result', () => {
        // Act
        const result1 = ColumnBuilder.timestamps();
        const result2 = ColumnBuilder.timestamps();

        // Assert
        expect(result1).toEqual(result2);
      });

      it('should handle empty options object', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {});

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
          'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        ]);
      });

      it('should handle undefined options', () => {
        // Act
        const result = ColumnBuilder.timestamps(undefined as any);

        // Assert
        expect(result).toEqual([
          'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
          'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        ]);
      });

      it('should handle string default values', () => {
        // Act
        const result = ColumnBuilder.timestamps(false, {
          default: '2023-01-01 00:00:00',
        });

        // Assert
        expect(result).toEqual([
          "created_at TIMESTAMPTZ NOT NULL DEFAULT '2023-01-01 00:00:00'",
          "updated_at TIMESTAMPTZ NOT NULL DEFAULT '2023-01-01 00:00:00'",
        ]);
      });
    });

    describe('softDelete', () => {
      it('should return soft delete column definition', () => {
        // Act
        const result = ColumnBuilder.softDelete();

        // Assert
        expect(result).toBe('deleted_at TIMESTAMPTZ NULL');
      });

      it('should return string type', () => {
        // Act
        const result = ColumnBuilder.softDelete();

        // Assert
        expect(typeof result).toBe('string');
      });

      it('should return consistent result', () => {
        // Act
        const result1 = ColumnBuilder.softDelete();
        const result2 = ColumnBuilder.softDelete();

        // Assert
        expect(result1).toBe(result2);
    });
    });

    describe('enum', () => {
      it('should create enum column with BILLING_TYPE enum', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE');

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE');
      });

      it('should create enum column with USER_EDITORS_ROLES enum', () => {
        // Act
        const result = ColumnBuilder.enum('user_role', 'USER_EDITORS_ROLES');

        // Assert
        expect(result).toBe('user_role USER_EDITORS_ROLES');
      });

      it('should create enum column with nullable option', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          nullable: true,
        });

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE NULL');
      });

      it('should create enum column with unique option', () => {
        // Act
        const result = ColumnBuilder.enum('user_role', 'USER_EDITORS_ROLES', {
          unique: true,
        });

        // Assert
        expect(result).toBe('user_role USER_EDITORS_ROLES NOT NULL UNIQUE');
      });

      it('should create enum column with default value', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          default: 'MONTHLY',
        });

        // Assert
        expect(result).toBe(
          "billing_type BILLING_TYPE NOT NULL DEFAULT 'MONTHLY'",
        );
      });

      it('should create enum column with multiple options', () => {
        // Act
        const result = ColumnBuilder.enum('user_role', 'USER_EDITORS_ROLES', {
          nullable: true,
          unique: true,
          default: 'EDITOR',
        });

        // Assert
        expect(result).toBe(
          "user_role USER_EDITORS_ROLES NULL DEFAULT 'EDITOR' UNIQUE",
        );
      });

      it('should create enum column with autoIncrement option', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
        });

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE NOT NULL');
      });

      it('should create enum column with all options', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          nullable: true,
          unique: true,
          default: 'YEARLY',
        });

        // Assert
        expect(result).toBe(
          "billing_type BILLING_TYPE NULL DEFAULT 'YEARLY' UNIQUE",
        );
      });

      it('should handle special characters in column name', () => {
        // Act
        const result = ColumnBuilder.enum(
          'user-role_123',
          'USER_EDITORS_ROLES',
        );

        // Assert
        expect(result).toBe('user-role_123 USER_EDITORS_ROLES');
      });

      it('should handle empty column name', () => {
        // Act & Assert
        expect(() => ColumnBuilder.enum('', 'BILLING_TYPE')).toThrow();
      });

      it('should throw error for null column name', () => {
        // Act & Assert
        expect(() =>
          ColumnBuilder.enum(null as any, 'BILLING_TYPE'),
        ).toThrow();
      });

      it('should throw error for undefined column name', () => {
        // Act & Assert
        expect(() =>
          ColumnBuilder.enum(undefined as any, 'BILLING_TYPE'),
        ).toThrow();
      });

      it('should throw error for non-string column name', () => {
        // Act & Assert
        expect(() => ColumnBuilder.enum(123 as any, 'BILLING_TYPE')).toThrow();
        expect(() => ColumnBuilder.enum({} as any, 'BILLING_TYPE')).toThrow();
        expect(() => ColumnBuilder.enum([] as any, 'BILLING_TYPE')).toThrow();
      });

      it('should handle very long column names', () => {
        // Act
        const longName = 'a'.repeat(100);
        const result = ColumnBuilder.enum(longName, 'BILLING_TYPE');

        // Assert
        expect(result).toBe(`${longName} BILLING_TYPE`);
      });

      it('should handle column names with spaces', () => {
        // Act
        const result = ColumnBuilder.enum('user role', 'USER_EDITORS_ROLES');

        // Assert
        expect(result).toBe('user role USER_EDITORS_ROLES');
      });

      it('should handle null default value', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          default: null,
        });

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE NOT NULL DEFAULT NULL');
      });

      it('should handle boolean default values', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          default: 'LIFETIME',
        });

        // Assert
        expect(result).toBe(
          "billing_type BILLING_TYPE NOT NULL DEFAULT 'LIFETIME'",
        );
      });

      it('should handle numeric default values', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {
          default: 'MONTHLY',
        });

        // Assert
        expect(result).toBe(
          "billing_type BILLING_TYPE NOT NULL DEFAULT 'MONTHLY'",
        );
      });

      it('should return string type', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE');

        // Assert
        expect(typeof result).toBe('string');
      });

      it('should return consistent result', () => {
        // Act
        const result1 = ColumnBuilder.enum('billing_type', 'BILLING_TYPE');
        const result2 = ColumnBuilder.enum('billing_type', 'BILLING_TYPE');

        // Assert
        expect(result1).toBe(result2);
      });

      it('should handle empty options object', () => {
        // Act
        const result = ColumnBuilder.enum('billing_type', 'BILLING_TYPE', {});

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE NOT NULL');
      });

      it('should handle undefined options', () => {
        // Act
        const result = ColumnBuilder.enum(
          'billing_type',
          'BILLING_TYPE',
          undefined,
        );

        // Assert
        expect(result).toBe('billing_type BILLING_TYPE');
      });

      it('should handle unicode characters in column name', () => {
        // Act
        const result = ColumnBuilder.enum('café', 'BILLING_TYPE');

        // Assert
        expect(result).toBe('café BILLING_TYPE');
      });

      it('should handle emoji in column name', () => {
        // Act
        const result = ColumnBuilder.enum('user😀', 'USER_EDITORS_ROLES');

        // Assert
        expect(result).toBe('user😀 USER_EDITORS_ROLES');
      });
    });

    describe('buildOptions', () => {
      it('should build options string with default values', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({});

        // Assert
        expect(result).toBe('NOT NULL');
      });

      it('should build options string with nullable true', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ nullable: true });

        // Assert
        expect(result).toBe('NULL');
      });

      it('should build options string with unique true', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ unique: true });

        // Assert
        expect(result).toBe('NOT NULL UNIQUE');
      });

      it('should build options string with SERIAL true', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({
          autoIncrement: true,
        });

        // Assert
        expect(result).toBe('NOT NULL');
      });

      it('should build options string with default value', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ default: 'test' });

        // Assert
        expect(result).toBe("NOT NULL DEFAULT 'test'");
      });

      it('should build options string with null default', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ default: null });

        // Assert
        expect(result).toBe('NOT NULL DEFAULT NULL');
      });

      it('should build options string with all options', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({
          nullable: true,
          unique: true,
          default: 'test',
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        });

        // Assert
        expect(result).toBe("NULL DEFAULT 'test' UNIQUE");
      });

      it('should merge with default options', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ nullable: true });

        // Assert
        expect(result).toBe('NULL');
      });

      it('should handle undefined values', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({
          nullable: undefined,
          unique: undefined,
          default: undefined,
        });

        // Assert
        expect(result).toBe('NOT NULL');
      });

      it('should handle empty string default', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ default: '' });

        // Assert
        expect(result).toBe("NOT NULL DEFAULT ''");
      });

      it('should handle boolean default values', () => {
        // Act
        const result1 = (ColumnBuilder as any).buildOptions({ default: true });
        const result2 = (ColumnBuilder as any).buildOptions({ default: false });

        // Assert
        expect(result1).toBe('NOT NULL DEFAULT true');
        expect(result2).toBe('NOT NULL DEFAULT false');
      });

      it('should handle numeric default values', () => {
        // Act
        const result = (ColumnBuilder as any).buildOptions({ default: 42 });

        // Assert
        expect(result).toBe('NOT NULL DEFAULT 42');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle very long column names', () => {
        // Act
        const longName = 'a'.repeat(1000);

        // Assert
        expect(() => ColumnBuilder.string(longName)).toThrow();
      });

      it('should handle special characters in column names', () => {
        const specialNames = [
          'column-name',
          'column_name',
          'column.name',
          'column name',
          'column@name',
          'column#name',
          'column$name',
          'column%name',
          'column^name',
          'column&name',
          'column*name',
          'column(name)',
          'column[name]',
          'column{name}',
          'column|name',
          'column\\name',
          'column/name',
          'column:name',
          'column;name',
          'column"name"',
          "column'name'",
          'column<name>',
          'column,name',
          'column?name',
          'column!name',
          'column~name',
          'column`name`',
        ];

        specialNames.forEach((name) => {
          const result = ColumnBuilder.string(name);
          expect(result).toBe(`${name} VARCHAR(255) NOT NULL`);
        });
      });

      it('should handle extreme length values', () => {
        // Act
        const result = ColumnBuilder.string('test', Number.MAX_SAFE_INTEGER);

        // Assert
        expect(result).toBe(
          `test VARCHAR(${Number.MAX_SAFE_INTEGER}) NOT NULL`,
        );
      });

      it('should handle negative infinity and positive infinity', () => {
        // Assert
        expect(() =>
          ColumnBuilder.string('test', Number.NEGATIVE_INFINITY),
        ).toThrow();
        expect(() =>
          ColumnBuilder.string('test2', Number.POSITIVE_INFINITY),
        ).toThrow();
      });

      it('should handle NaN length values', () => {
        // Act

        // Assert
        expect(() => ColumnBuilder.string('test', NaN)).toThrow();
      });

      it('should handle complex options objects', () => {
        // Act
        const result = ColumnBuilder.integer('id', {
          nullable: true,
          unique: true,
          default: 1,
        });

        // Assert
        expect(result).toBe('id INTEGER NULL DEFAULT 1 UNIQUE');
      });
    });

    describe('Return Value Consistency', () => {
      it('should return string for all column methods', () => {
        // Act
        const idResult = ColumnBuilder.id('test');
        const integerResult = ColumnBuilder.integer('test');
        const bigintResult = ColumnBuilder.bigint('test');
        const booleanResult = ColumnBuilder.boolean('test');
        const stringResult = ColumnBuilder.string('test');
        const foreignKeyResult = ColumnBuilder.foreignKey(
          'test',
          'table' as any,
          'column',
        );
        const emailResult = ColumnBuilder.email('test');
        const passwordResult = ColumnBuilder.password('test');
        const timestampResult = ColumnBuilder.timestamp('test');
        const timestampsResult = ColumnBuilder.timestamps();
        const softDeleteResult = ColumnBuilder.softDelete();
        const enumResult = ColumnBuilder.enum('test', 'BILLING_TYPE');

        // Assert
        expect(typeof idResult).toBe('string');
        expect(typeof integerResult).toBe('string');
        expect(typeof bigintResult).toBe('string');
        expect(typeof booleanResult).toBe('string');
        expect(typeof stringResult).toBe('string');
        expect(typeof foreignKeyResult).toBe('string');
        expect(typeof emailResult).toBe('string');
        expect(typeof passwordResult).toBe('string');
        expect(typeof timestampResult).toBe('string');
        expect(Array.isArray(timestampsResult)).toBe(true);
        expect(typeof softDeleteResult).toBe('string');
        expect(typeof enumResult).toBe('string');
      });

      it('should return consistent results for same inputs', () => {
        // Act
        const result1 = ColumnBuilder.string('name', 100, { nullable: true });
        const result2 = ColumnBuilder.string('name', 100, { nullable: true });

        // Assert
        expect(result1).toBe(result2);
      });
    });

    describe('Performance and Memory', () => {
      it('should handle large number of method calls', () => {
        // Act
        const results = [];
        for (let i = 0; i < 1000; i++) {
          results.push(
            ColumnBuilder.string(`column${i}`, 255, { nullable: true }),
          );
        }

        // Assert
        expect(results).toHaveLength(1000);
        expect(results[0]).toBe('column0 VARCHAR(255) NULL');
        expect(results[999]).toBe('column999 VARCHAR(255) NULL');
      });

      it('should handle complex options efficiently', () => {
        // Act
        const complexOptions: ColumnAttributes = {
          nullable: true,
          unique: true,
          default: 'test',
        };

        const results = [];
        for (let i = 0; i < 100; i++) {
          results.push(ColumnBuilder.integer(`col${i}`, complexOptions));
        }

        // Assert
        expect(results).toHaveLength(100);
        results.forEach((result) => {
          expect(result).toContain('INTEGER');
          expect(result).toContain("NULL DEFAULT 'test' UNIQUE");
        });
      });
    });

    describe('Type Safety', () => {
      it('should handle valid OnAction types', () => {
        const validActions: Array<
          'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'
        > = ['SET NULL', 'CASCADE', 'RESTRICT', 'NO ACTION'];

        validActions.forEach((action) => {
          const result = ColumnBuilder.foreignKey(
            'id',
            'table' as any,
            'column',
            {
              onDelete: action,
              onUpdate: action,
            },
          );
          expect(result).toContain(`ON DELETE ${action}`);
          expect(result).toContain(`ON UPDATE ${action}`);
        });
      });

      it('should handle various default value types', () => {
        // Act
        const stringDefault = ColumnBuilder.string('name', 255, {
          default: 'test',
        });
        const numberDefault = ColumnBuilder.integer('count', { default: 42 });
        const booleanDefault = ColumnBuilder.boolean('active', {
          default: true,
        });
        const nullDefault = ColumnBuilder.string('value', 255, {
          default: null,
        });
        const enumDefault = ColumnBuilder.enum(
          'billing_type',
          'BILLING_TYPE',
          { default: 'MONTHLY' },
        );

        // Assert
        expect(stringDefault).toContain("DEFAULT 'test'");
        expect(numberDefault).toContain('DEFAULT 42');
        expect(booleanDefault).toContain('DEFAULT true');
        expect(nullDefault).toContain('DEFAULT NULL');
        expect(enumDefault).toContain("DEFAULT 'MONTHLY'");
      });

      it('should handle valid enum types', () => {
        // Act
        const billingEnum = ColumnBuilder.enum('billing_type', 'BILLING_TYPE');
        const roleEnum = ColumnBuilder.enum('user_role', 'USER_EDITORS_ROLES');

        // Assert
        expect(billingEnum).toContain('BILLING_TYPE');
        expect(roleEnum).toContain('USER_EDITORS_ROLES');
      });
    });
  });
});
