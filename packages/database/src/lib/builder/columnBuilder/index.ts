import { ClientNotInitializedException } from '../../client/exceptions';
import { getClientConfig } from '../../client';
import { AvailableEnums, DatabaseClient, TableName } from '../../utils/types';
import { ENUMS } from 'lib/utils/constants';

export type OnAction = 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'NO ACTION';

export type ColumnBuilderOptions = {
  nullable?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  default?: string | number | boolean | null;
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
    return `${this.validateStringAndReturn(columnName)} VARCHAR(${length})${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static text(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} TEXT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static foreignKey(
    columnName: string,
    foreignTableName: TableName,
    foreignTableColumnName: string = 'id',
    options?: ColumnBuilderOptions,
  ) {
    // If onDelete is SET NULL, the column must be nullable
    const _options = {
      ...options,
      // Force nullable to true if onDelete is SET NULL, regardless of what's passed
      nullable:
        options?.onDelete === 'SET NULL' ? true : (options?.nullable ?? false),
    };
    return `${this.validateStringAndReturn(columnName)} INT REFERENCES ${this.validateStringAndReturn(foreignTableName)} (${this.validateStringAndReturn(foreignTableColumnName)}) ${this.buildForeignKeyOptions(_options)}`;
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
      concatenateOptions(
        `DEFAULT ${_options.default === null ? 'NULL' : _options.default}`,
      );
    }

    // 3. UNIQUE
    if (_options.unique) {
      concatenateOptions('UNIQUE');
    }

    // 4. AUTO_INCREMENT
    if (_options.autoIncrement) {
      concatenateOptions(this.getAutoIncrement(clientChoosen));
    }

    // 5. ON DELETE (for foreign keys)
    if (_options.onDelete) {
      concatenateOptions(`ON DELETE ${_options.onDelete}`);
    }

    // 6. ON UPDATE (for foreign keys)
    if (_options.onUpdate) {
      concatenateOptions(`ON UPDATE ${_options.onUpdate}`);
    }

    return optionsString;
  }

  protected static buildForeignKeyOptions(options: ColumnBuilderOptions) {
    const _options = { ...DEFAULT_COLUMN_OPTIONS, ...options };
    let optionsString = '';
    const concatenateOptions = (options: string) => {
      if (optionsString.length > 0 && options.length > 0) {
        optionsString += ' ';
      }
      optionsString += options;
    };

    // For foreign keys, build options in proper SQL order
    // 1. NOT NULL (only if explicitly set to false)
    if (_options.nullable === false) {
      concatenateOptions('NOT NULL');
    }
    // Note: We don't add 'NULL' explicitly as it's the default for nullable columns

    // 2. ON DELETE (for foreign keys)
    if (_options.onDelete) {
      concatenateOptions(`ON DELETE ${_options.onDelete}`);
    }

    // 3. ON UPDATE (for foreign keys)
    if (_options.onUpdate) {
      concatenateOptions(`ON UPDATE ${_options.onUpdate}`);
    }

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
    options: ColumnBuilderOptions = {
      nullable: false,
    },
  ) {
    const _options: ColumnBuilderOptions = {
      nullable: false,
      ...options,
    };

    return `${this.validateStringAndReturn(columnName)} TIMESTAMP ${this.buildOptions(_options)}`;
  }
  public static enum(
    columnName: string,
    enumName: keyof AvailableEnums,
    options?: ColumnBuilderOptions,
  ) {
    return `${this.validateStringAndReturn(columnName)} ${enumName}${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static timestamps(
    options: ColumnBuilderOptions = {
      nullable: false,
      default: 'NOW()',
    },
  ) {
    const _options: ColumnBuilderOptions = {
      nullable: false,
      default: 'NOW()',
      ...options,
    };
    return [
      this.timestamp('created_at', _options),
      this.timestamp('updated_at', _options),
    ];
  }
  public static softDelete(columnName: string = 'deleted_at') {
    return `${this.validateStringAndReturn(columnName || 'deleted_at')} TIMESTAMP NULL`;
  }
}
