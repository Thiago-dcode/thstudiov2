import { ClientNotInitializedException } from '../../client/exceptions';
import { getClientConfig } from '../../client';
import {
  AvailableEnums,
  DatabaseClient,
  SqlFunction,
  SqlFunctionTimestamp,
  TableName,
} from '../../utils/types';
import { ENUMS, SQL_FUNCTIONS } from '../../utils/constants';

export type OnAction = 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION';

export type ColumnBuilderOptions<
  T = string | number | boolean | null | SqlFunction,
> = {
  nullable?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  default?: T | null;
};
export type ColumnBuilderOptionsWithForeignKey = ColumnBuilderOptions & {
  onDelete?: OnAction;
  onUpdate?: OnAction;
};
export const DEFAULT_COLUMN_OPTIONS: ColumnBuilderOptions = {
  nullable: false,
  unique: false,
  autoIncrement: false,
};
export class ColumnBuilder {
  protected static validateStringAndReturn(columnName: any): string {
    if (typeof columnName !== 'string') {
      throw new Error(`Column name must be a string, got ${typeof columnName}`);
    }

    const sanitazedColumnName = columnName.trim();
    if (!sanitazedColumnName || sanitazedColumnName.length > 255) {
      throw new Error(
        `Column name cannot be empty or longer than 255 characters`,
      );
    }
    return sanitazedColumnName;
  }

  public static id(columnName: string = 'id') {
    const clientChoosen = getClientConfig();
    if (!clientChoosen) {
      throw new ClientNotInitializedException('Client not initialized');
    }

    return `${this.validateStringAndReturn(columnName || 'id')} ${this.getAutoIncrement(clientChoosen)} PRIMARY KEY NOT NULL`;
  }
  public static getAutoIncrement(clientChoosen: DatabaseClient) {
    switch (clientChoosen) {
      case 'postgres':
        return 'SERIAL';
      case 'mysql':
        return 'AUTO_INCREMENT';
      default:
        return '';
    }
  }
  public static integer(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} INTEGER${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static bigint(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} BIGINT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static boolean(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} BOOLEAN${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static string(
    columnName: string,
    length: number = 255,
    options?: ColumnBuilderOptions,
  ) {
    if (
      length === undefined ||
      length < 0 ||
      isNaN(length) ||
      length === Infinity ||
      length === -Infinity
    ) {
      throw new Error('Length must be a positive number');
    }
    return `${this.validateStringAndReturn(columnName)} VARCHAR(${length}) ${this.buildOptions(options || {})}`;
  }
  public static text(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} TEXT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static foreignKey(
    columnName: string,
    foreignTableName: TableName,
    foreignTableColumnName: string = 'id',
    options?: ColumnBuilderOptionsWithForeignKey,
  ) {
    // If onDelete is SET NULL, the column must be nullable
    const _options = {
      ...options,
      unique: false,
      nullable:
        options?.onDelete || options?.onUpdate ? undefined : options?.nullable,
    };
    return `${this.validateStringAndReturn(columnName)} INT REFERENCES ${this.validateStringAndReturn(foreignTableName)} (${this.validateStringAndReturn(foreignTableColumnName)})${!_options.onDelete && !_options.onUpdate ? ' ' + this.buildOptions(_options) : ''}${_options.onDelete || _options.onUpdate ? ' ' + this.buildForeignKeyOptions({
      onDelete: _options.onDelete,
      onUpdate: _options.onUpdate,
    }) : ''}`;
  }

  protected static buildOptions(options: ColumnBuilderOptions) {
    const clientChoosen = getClientConfig();
    if (!clientChoosen) {
      throw new ClientNotInitializedException('Client not initialized');
    }
    const _options = { ...DEFAULT_COLUMN_OPTIONS, ...options };
    let optionsString = '';
    const concatenateOptions = (options: string) => {
      if (optionsString.length > 0 && options.length > 0) {
        optionsString += ' ';
      }
      optionsString += options;
    };

    // Build options in proper SQL order
    // 1. NOT NULL/NULL
    if (_options.nullable !== undefined) {
      concatenateOptions(_options.nullable ? 'NULL' : 'NOT NULL');
    } else {
      // Default behavior when nullable is undefined
      concatenateOptions('NOT NULL');
    }

    // 2. DEFAULT
    if (_options.default !== undefined) {
      const defaultValue =
        _options.default === null
          ? 'NULL'
          : typeof _options.default === 'string'
            ? SQL_FUNCTIONS.includes(_options.default as SqlFunction)
              ? _options.default
              : `'${_options.default}'`
            : _options.default;
      concatenateOptions(`DEFAULT ${defaultValue}`);
    }

    // 3. UNIQUE
    if (_options.unique) {
      concatenateOptions('UNIQUE');
    }

    // 4. AUTO_INCREMENT
    if (_options.autoIncrement) {
      concatenateOptions(this.getAutoIncrement(clientChoosen));
    }

    return optionsString;
  }

  protected static buildForeignKeyOptions(
    options: Pick<ColumnBuilderOptionsWithForeignKey, 'onDelete' | 'onUpdate'>,
  ) {
    let optionsString = '';
    const concatenateOptions = (options: string) => {
      if (optionsString.length > 0 && options.length > 0) {
        optionsString += ' ';
      }
      optionsString += options;
    };

    // For foreign keys, build options in proper SQL order
    // 1. ON DELETE (for foreign keys)
    if (options.onDelete) {
      concatenateOptions(`ON DELETE ${options.onDelete}`);
    }

    // 2. ON UPDATE (for foreign keys)
    if (options.onUpdate) {
      concatenateOptions(`ON UPDATE ${options.onUpdate}`);
    }

    // Don't add NOT NULL/NULL when foreign key constraints are present
    // The constraint type already implies the nullability behavior

    return optionsString;
  }

  public static email(
    columnName: string = 'email',
    options?: ColumnBuilderOptions,
  ) {
    // Handle the case where undefined is explicitly passed

    const _options = {
      nullable: false,
      unique: true,
      ...options,
    };
    return `${this.validateStringAndReturn(columnName || 'email')} VARCHAR(255) ${this.buildOptions(_options)}`;
  }
  public static password(columnName: string = 'password') {
    // Handle the case where undefined is explicitly passed
    return `${this.validateStringAndReturn(columnName || 'password')} VARCHAR(255) NOT NULL`;
  }

  public static timestamp(
    columnName: string,
    options: ColumnBuilderOptions<SqlFunctionTimestamp> = {
      nullable: false,
    },
  ) {
    const _options: ColumnBuilderOptions<SqlFunctionTimestamp > = {
      nullable: false,
      ...options,
    };

    return `${this.validateStringAndReturn(columnName)} TIMESTAMP ${this.buildOptions(_options)}`;
  }
  // Function overloads for better type inference
  public static enum(
    columnName: string,
    enumName: 'BILLING_TYPES',
    options?: ColumnBuilderOptions<(typeof ENUMS.BILLING_TYPES)[number]>,
  ): string;
  public static enum(
    columnName: string,
    enumName: 'USER_EDITORS_ROLES',
    options?: ColumnBuilderOptions<(typeof ENUMS.USER_EDITORS_ROLES)[number]>,
  ): string;
  public static enum(
    columnName: string,
    enumName: 'LANGUAGE_CODE',
    options?: ColumnBuilderOptions<(typeof ENUMS.LANGUAGE_CODE)[number]>,
  ): string;
  public static enum(
    columnName: string,
    enumName: 'MEDIA_SHAPE',
    options?: ColumnBuilderOptions<(typeof ENUMS.MEDIA_SHAPE)[number]>,
  ): string;
  public static enum<T extends keyof AvailableEnums>(
    columnName: string,
    enumName: T,
    options?: ColumnBuilderOptions<(typeof ENUMS)[T][number]>,
  ): string {
    return `${this.validateStringAndReturn(columnName)} ${enumName}${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static timestamps(
    withDeletedAt: boolean = false,
    options: ColumnBuilderOptions<SqlFunctionTimestamp > = {
      nullable: false,
      default: 'NOW()',
    },
  ) {
    const _options: ColumnBuilderOptions<SqlFunctionTimestamp > = {
      nullable: false,
      default: 'NOW()',
      ...options,
    };
    const columns = [
      this.timestamp('created_at', _options),
      this.timestamp('updated_at', _options),
    ];
    if (withDeletedAt) {
      columns.push(this.softDelete());
    }
    return columns;
  }
  public static softDelete(columnName: string = 'deleted_at') {
    return `${this.validateStringAndReturn(columnName || 'deleted_at')} TIMESTAMP NULL`;
  }
}
