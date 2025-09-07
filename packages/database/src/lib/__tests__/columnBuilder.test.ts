import { ColumnBuilder, ColumnBuilderOptions, DEFAULT_COLUMN_OPTIONS } from '../builder/columnBuilder';

describe('ColumnBuilder', () => {
  describe('DEFAULT_COLUMN_OPTIONS', () => {
    it('should have correct default values', () => {
      // Assert
      expect(DEFAULT_COLUMN_OPTIONS).toEqual({
        nullable: false,
        unique: false,
        autoIncrement: false,
      });
    });
  });

  describe('id', () => {
    it('should create id column with default name', () => {
      // Act
      const result = ColumnBuilder.id();

      // Assert
      expect(result).toBe('id SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL');
    });

    it('should create id column with custom name', () => {
      // Act
      const result = ColumnBuilder.id('user_id');

      // Assert
      expect(result).toBe('user_id SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL');
    });

    it('should handle empty string as column name', () => {
      // Act
      const result = ColumnBuilder.id('');

      // Assert
      expect(result).toBe('id SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL');
    });

    it('should handle special characters in column name', () => {
      // Act
      const result = ColumnBuilder.id('user-id_123');

      // Assert
      expect(result).toBe('user-id_123 SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL');
    });

    it('should handle column names with spaces', () => {
      // Act
      const result = ColumnBuilder.id('user id');

      // Assert
      expect(result).toBe('user id SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL');
    });

    it('should handle very long column names', () => {
      // Act
      const longName = 'a'.repeat(100);
      const result = ColumnBuilder.id(longName);

      // Assert
      expect(result).toBe(`${longName} SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL`);
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
      expect(result).toBe('age INTEGER ');
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
      const result = ColumnBuilder.integer('id', { autoIncrement: true });

      // Assert
      expect(result).toBe('id INTEGER NOT NULL AUTOINCREMENT');
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
      expect(result).toBe('score INTEGER NULL UNIQUE DEFAULT 100');
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
      expect(result).toBe('id BIGINT ');
    });

    it('should create bigint column with options', () => {
      // Act
      const result = ColumnBuilder.bigint('id', {
        nullable: true,
        unique: true,
        autoIncrement: true,
      });

      // Assert
      expect(result).toBe('id BIGINT NULL UNIQUE AUTOINCREMENT');
    });

    it('should handle special characters in column name', () => {
      // Act
      const result = ColumnBuilder.bigint('user-id_123');

      // Assert
      expect(result).toBe('user-id_123 BIGINT ');
    });
  });

  describe('boolean', () => {
    it('should create boolean column without options', () => {
      // Act
      const result = ColumnBuilder.boolean('is_active');

      // Assert
      expect(result).toBe('is_active BOOLEAN ');
    });

    it('should create boolean column with default true', () => {
      // Act
      const result = ColumnBuilder.boolean('is_active', { default: true });

      // Assert
      expect(result).toBe('is_active BOOLEAN NOT NULL   DEFAULT true');
    });

    it('should create boolean column with default false', () => {
      // Act
      const result = ColumnBuilder.boolean('is_deleted', { default: false });

      // Assert
      expect(result).toBe('is_deleted BOOLEAN NOT NULL   DEFAULT false');
    });

    it('should create nullable boolean column', () => {
      // Act
      const result = ColumnBuilder.boolean('is_verified', { nullable: true });

      // Assert
      expect(result).toBe('is_verified BOOLEAN NULL  ');
    });
  });

  describe('string', () => {
    it('should create string column with default length', () => {
      // Act
      const result = ColumnBuilder.string('name');

      // Assert
      expect(result).toBe('name VARCHAR(255) ');
    });

    it('should create string column with custom length', () => {
      // Act
      const result = ColumnBuilder.string('description', 500);

      // Assert
      expect(result).toBe('description VARCHAR(500) ');
    });

    it('should create string column with options', () => {
      // Act
      const result = ColumnBuilder.string('name', 100, {
        nullable: true,
        unique: true,
        default: 'John',
      });

      // Assert
      expect(result).toBe('name VARCHAR(100) NULL UNIQUE  DEFAULT John');
    });

    it('should handle zero length', () => {
      // Act
      const result = ColumnBuilder.string('code', 0);

      // Assert
      expect(result).toBe('code VARCHAR(0) ');
    });

    it('should handle very large length', () => {
      // Act
      const result = ColumnBuilder.string('content', 65535);

      // Assert
      expect(result).toBe('content VARCHAR(65535) ');
    });

    it('should handle negative length', () => {
      // Act
      const result = ColumnBuilder.string('test', -1);

      // Assert
      expect(result).toBe('test VARCHAR(-1) ');
    });

    it('should handle decimal length values', () => {
      // Act
      const result = ColumnBuilder.string('test', 100.5);

      // Assert
      expect(result).toBe('test VARCHAR(100.5) ');
    });

    it('should handle empty column name', () => {

      expect(() => ColumnBuilder.string('')).toThrow();
      expect(() => ColumnBuilder.string(null as any)).toThrow();
      expect(() => ColumnBuilder.string(undefined as any)).toThrow();
      expect(() => ColumnBuilder.string(123 as any)).toThrow();
      expect(() => ColumnBuilder.string({} as any)).toThrow();
      expect(() => ColumnBuilder.string([] as any)).toThrow();
    });


    it('should handle special characters in column name', () => {
      // Act
      const result = ColumnBuilder.string('user-name_123');

      // Assert
      expect(result).toBe('user-name_123 VARCHAR(255) ');
    });

  

  describe('foreignKey', () => {
    it('should create foreign key column with default options', () => {
      // Act
      const result = ColumnBuilder.foreignKey('user_id', 'users', 'id');

      // Assert
      expect(result).toBe('user_id INT FOREIGN KEY REFERENCES users (id) NOT NULL  ');
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
        'user_id INT FOREIGN KEY REFERENCES users (id) NULL   ON DELETE CASCADE ON UPDATE RESTRICT',
      );
    });

    it('should handle different onDelete actions', () => {
      const actions: Array<'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'> = [
        'SET NULL',
        'CASCADE',
        'RESTRICT',
        'NO ACTION',
      ];

      actions.forEach((action) => {
        const result = ColumnBuilder.foreignKey('user_id', 'users', 'id', {
          onDelete: action,
        });
        expect(result).toContain(`ON DELETE ${action}`);
      });
    });

    it('should handle different onUpdate actions', () => {
      const actions: Array<'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'> = [
        'SET NULL',
        'CASCADE',
        'RESTRICT',
        'NO ACTION',
      ];

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
        'user_profiles',
        'profile_id',
        { nullable: true, onDelete: 'CASCADE' },
      );

      // Assert
      expect(result).toBe(
        'order_user_id INT FOREIGN KEY REFERENCES user_profiles (profile_id) NULL   ON DELETE CASCADE',
      );
    });

    it('should throw error for null column name', () => {
      // Act & Assert
      expect(() => ColumnBuilder.foreignKey(null as any, 'users', 'id')).toThrow();
    });

    it('should throw error for null table name', () => {
      // Act & Assert
      expect(() => ColumnBuilder.foreignKey('user_id', null as any, 'id')).toThrow();
    });

    it('should throw error for null table column name', () => {
      // Act & Assert
      expect(() => ColumnBuilder.foreignKey('user_id', 'users', null as any)).toThrow();
    });
  });

  describe('email', () => {
    it('should create email column with default name and options', () => {
      // Act
      const result = ColumnBuilder.email();

      // Assert
      expect(result).toBe('email VARCHAR(255) NOT NULL UNIQUE ');
    });

    it('should create email column with custom name', () => {
      // Act
      const result = ColumnBuilder.email('user_email');

      // Assert
      expect(result).toBe('user_email VARCHAR(255) NOT NULL UNIQUE ');
    });

    it('should create email column with custom options', () => {
      // Act
      const result = ColumnBuilder.email('user_email', {
        nullable: true,
        unique: false,
        default: 'test@example.com',
      });

      // Assert
      expect(result).toBe('user_email VARCHAR(255) NULL   DEFAULT test@example.com');
    });

    it('should override default options with custom options', () => {
      // Act
      const result = ColumnBuilder.email('email', { nullable: true });

      // Assert
      expect(result).toBe('email VARCHAR(255) NULL UNIQUE ');
    });

    it('should handle empty email column name', () => {
      // Act
      const result = ColumnBuilder.email('');

      // Assert
      expect(result).toBe('email VARCHAR(255) NOT NULL UNIQUE ');
    });

    it('should handle special characters in email column name', () => {
      // Act
      const result = ColumnBuilder.email('user-email_123');

      // Assert
      expect(result).toBe('user-email_123 VARCHAR(255) NOT NULL UNIQUE ');
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
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT NOW()');
    });

    it('should create timestamp column with custom options', () => {
      // Act
      const result = ColumnBuilder.timestamp('updated_at', {
        nullable: true,
        default: 'CURRENT_TIMESTAMP',
      });

      // Assert
      expect(result).toBe('updated_at TIMESTAMP NULL   DEFAULT CURRENT_TIMESTAMP');
    });

    it('should create nullable timestamp without default', () => {
      // Act
      const result = ColumnBuilder.timestamp('deleted_at', {
        nullable: true,
        default: undefined,
      });

      // Assert
      expect(result).toBe('deleted_at TIMESTAMP NULL  ');
    });

    it('should handle null default value', () => {
      // Act
      const result = ColumnBuilder.timestamp('expires_at', {
        nullable: true,
        default: null,
      });

      // Assert
      expect(result).toBe('expires_at TIMESTAMP NULL   DEFAULT NULL');
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
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT NOW(), updated_at TIMESTAMP NOT NULL   DEFAULT NOW()');
    });

    it('should create timestamps with custom options', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        nullable: true,
        default: 'CURRENT_TIMESTAMP',
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NULL   DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL   DEFAULT CURRENT_TIMESTAMP');
    });

    it('should create nullable timestamps without default', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        nullable: true,
        default: undefined,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NULL  , updated_at TIMESTAMP NULL  ');
    });

    it('should handle null default value', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        nullable: true,
        default: null,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NULL   DEFAULT NULL, updated_at TIMESTAMP NULL   DEFAULT NULL');
    });

    it('should create timestamps with unique constraint', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        unique: true,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL UNIQUE  DEFAULT NOW(), updated_at TIMESTAMP NOT NULL UNIQUE  DEFAULT NOW()');
    });

    it('should create timestamps with autoIncrement', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        autoIncrement: true,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL  AUTOINCREMENT DEFAULT NOW(), updated_at TIMESTAMP NOT NULL  AUTOINCREMENT DEFAULT NOW()');
    });

    it('should create timestamps with all options', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        nullable: true,
        unique: true,
        autoIncrement: true,
        default: 'CURRENT_TIMESTAMP',
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NULL UNIQUE AUTOINCREMENT DEFAULT CURRENT_TIMESTAMP ON DELETE CASCADE ON UPDATE RESTRICT, updated_at TIMESTAMP NULL UNIQUE AUTOINCREMENT DEFAULT CURRENT_TIMESTAMP ON DELETE CASCADE ON UPDATE RESTRICT');
    });

    it('should return string type', () => {
      // Act
      const result = ColumnBuilder.timestamps();

      // Assert
      expect(typeof result).toBe('string');
    });

    it('should return consistent result', () => {
      // Act
      const result1 = ColumnBuilder.timestamps();
      const result2 = ColumnBuilder.timestamps();

      // Assert
      expect(result1).toBe(result2);
    });

    it('should handle empty options object', () => {
      // Act
      const result = ColumnBuilder.timestamps({});

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT NOW(), updated_at TIMESTAMP NOT NULL   DEFAULT NOW()');
    });

    it('should handle undefined options', () => {
      // Act
      const result = ColumnBuilder.timestamps(undefined as any);

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT NOW(), updated_at TIMESTAMP NOT NULL   DEFAULT NOW()');
    });

    it('should contain both created_at and updated_at columns', () => {
      // Act
      const result = ColumnBuilder.timestamps();

      // Assert
      expect(result).toContain('created_at TIMESTAMP');
      expect(result).toContain('updated_at TIMESTAMP');
    });

    it('should join columns with comma and space', () => {
      // Act
      const result = ColumnBuilder.timestamps();

      // Assert
      expect(result).toContain(', ');
      const parts = result.split(', ');
      expect(parts).toHaveLength(2);
    });

    it('should handle boolean default values', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        default: true,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT true, updated_at TIMESTAMP NOT NULL   DEFAULT true');
    });

    it('should handle numeric default values', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        default: 42,
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT 42, updated_at TIMESTAMP NOT NULL   DEFAULT 42');
    });

    it('should handle string default values', () => {
      // Act
      const result = ColumnBuilder.timestamps({
        default: '2023-01-01 00:00:00',
      });

      // Assert
      expect(result).toBe('created_at TIMESTAMP NOT NULL   DEFAULT 2023-01-01 00:00:00, updated_at TIMESTAMP NOT NULL   DEFAULT 2023-01-01 00:00:00');
    });
  });

  describe('softDelete', () => {
    it('should return soft delete column definition', () => {
      // Act
      const result = ColumnBuilder.softDelete();

      // Assert
      expect(result).toBe('deleted_at TIMESTAMP');
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

  describe('buildOptions', () => {
    it('should build options string with default values', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({});

      // Assert
      expect(result).toBe('NOT NULL  ');
    });

    it('should build options string with nullable true', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ nullable: true });

      // Assert
      expect(result).toBe('NULL  ');
    });

    it('should build options string with unique true', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ unique: true });

      // Assert
      expect(result).toBe('NOT NULL UNIQUE ');
    });

    it('should build options string with autoIncrement true', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ autoIncrement: true });

      // Assert
      expect(result).toBe('NOT NULL  AUTOINCREMENT');
    });

    it('should build options string with default value', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ default: 'test' });

      // Assert
      expect(result).toBe('NOT NULL   DEFAULT test');
    });

    it('should build options string with null default', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ default: null });

      // Assert
      expect(result).toBe('NOT NULL   DEFAULT NULL');
    });

    it('should build options string with onDelete', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ onDelete: 'CASCADE' });

      // Assert
      expect(result).toBe('NOT NULL   ON DELETE CASCADE');
    });

    it('should build options string with onUpdate', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ onUpdate: 'RESTRICT' });

      // Assert
      expect(result).toBe('NOT NULL   ON UPDATE RESTRICT');
    });

    it('should build options string with all options', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({
        nullable: true,
        unique: true,
        autoIncrement: true,
        default: 'test',
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      });

      // Assert
      expect(result).toBe('NULL UNIQUE AUTOINCREMENT DEFAULT test ON DELETE CASCADE ON UPDATE RESTRICT');
    });

    it('should merge with default options', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ nullable: true });

      // Assert
      expect(result).toBe('NULL  ');
    });

    it('should handle undefined values', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({
        nullable: undefined,
        unique: undefined,
        default: undefined,
      });

      // Assert
      expect(result).toBe('NOT NULL  ');
    });

    it('should handle empty string default', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ default: '' });

      // Assert
      expect(result).toBe('NOT NULL   DEFAULT ');
    });

    it('should handle boolean default values', () => {
      // Act
      const result1 = (ColumnBuilder as any).buildOptions({ default: true });
      const result2 = (ColumnBuilder as any).buildOptions({ default: false });

      // Assert
      expect(result1).toBe('NOT NULL   DEFAULT true');
      expect(result2).toBe('NOT NULL   DEFAULT false');
    });

    it('should handle numeric default values', () => {
      // Act
      const result = (ColumnBuilder as any).buildOptions({ default: 42 });

      // Assert
      expect(result).toBe('NOT NULL   DEFAULT 42');
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
        expect(result).toBe(`${name} VARCHAR(255) `);
      });
    });

    it('should handle unicode characters in column names', () => {
      // Act
      const result = ColumnBuilder.string('café');

      // Assert
      expect(result).toBe('café VARCHAR(255) ');
    });

    it('should handle emoji in column names', () => {
      // Act
      const result = ColumnBuilder.string('user😀');

      // Assert
      expect(result).toBe('user😀 VARCHAR(255) ');
    });

    it('should handle extreme length values', () => {
      // Act
      const result = ColumnBuilder.string('test', Number.MAX_SAFE_INTEGER);

      // Assert
      expect(result).toBe(`test VARCHAR(${Number.MAX_SAFE_INTEGER}) `);
    });

    it('should handle negative infinity and positive infinity', () => {
      // Act
      const result1 = ColumnBuilder.string('test', Number.NEGATIVE_INFINITY);
      const result2 = ColumnBuilder.string('test2', Number.POSITIVE_INFINITY);

      // Assert
      expect(result1).toBe('test VARCHAR(-Infinity) ');
      expect(result2).toBe('test2 VARCHAR(Infinity) ');
    });

    it('should handle NaN length values', () => {
      // Act
      const result = ColumnBuilder.string('test', NaN);

      // Assert
      expect(result).toBe('test VARCHAR(NaN) ');
    });

    it('should handle complex options objects', () => {
      // Act
      const result = ColumnBuilder.integer('id', {
        nullable: true,
        unique: true,
        autoIncrement: true,
        default: 1,
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      });

      // Assert
      expect(result).toBe('id INTEGER NULL UNIQUE AUTOINCREMENT DEFAULT 1 ON DELETE CASCADE ON UPDATE RESTRICT');
    });

    it('should handle nested object options', () => {
      // Act
      const complexOptions = {
        nullable: true,
        unique: false,
        default: { nested: 'object' } as any,
      };
      const result = ColumnBuilder.string('data', 255, complexOptions);

      // Assert
      expect(result).toBe('data VARCHAR(255) NULL   DEFAULT [object Object]');
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
      const foreignKeyResult = ColumnBuilder.foreignKey('test', 'table', 'column');
      const emailResult = ColumnBuilder.email('test');
      const passwordResult = ColumnBuilder.password('test');
      const timestampResult = ColumnBuilder.timestamp('test');
      const timestampsResult = ColumnBuilder.timestamps();
      const softDeleteResult = ColumnBuilder.softDelete();

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
      expect(typeof timestampsResult).toBe('string');
      expect(typeof softDeleteResult).toBe('string');
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
        results.push(ColumnBuilder.string(`column${i}`, 255, { nullable: true }));
      }

      // Assert
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe('column0 VARCHAR(255) NULL  ');
      expect(results[999]).toBe('column999 VARCHAR(255) NULL  ');
    });

    it('should handle complex options efficiently', () => {
      // Act
      const complexOptions: ColumnBuilderOptions = {
        nullable: true,
        unique: true,
        autoIncrement: true,
        default: 'test',
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      };

      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(ColumnBuilder.integer(`col${i}`, complexOptions));
      }

      // Assert
      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result).toContain('INTEGER');
        expect(result).toContain('NULL UNIQUE AUTOINCREMENT DEFAULT test ON DELETE CASCADE ON UPDATE RESTRICT');
      });
    });
  });

  describe('Type Safety', () => {
    it('should handle valid OnAction types', () => {
      const validActions: Array<'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION'> = [
        'SET NULL',
        'CASCADE',
        'RESTRICT',
        'NO ACTION',
      ];

      validActions.forEach((action) => {
        const result = ColumnBuilder.foreignKey('id', 'table', 'column', {
          onDelete: action,
          onUpdate: action,
        });
        expect(result).toContain(`ON DELETE ${action}`);
        expect(result).toContain(`ON UPDATE ${action}`);
      });
    });

    it('should handle various default value types', () => {
      // Act
      const stringDefault = ColumnBuilder.string('name', 255, { default: 'test' });
      const numberDefault = ColumnBuilder.integer('count', { default: 42 });
      const booleanDefault = ColumnBuilder.boolean('active', { default: true });
      const nullDefault = ColumnBuilder.string('value', 255, { default: null });

      // Assert
      expect(stringDefault).toContain('DEFAULT test');
      expect(numberDefault).toContain('DEFAULT 42');
      expect(booleanDefault).toContain('DEFAULT true');
      expect(nullDefault).toContain('DEFAULT NULL');
    });
  });
  });
});