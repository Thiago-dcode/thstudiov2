import { ClientNotInitializedException } from '../../client/exceptions';
import { getClientConfig } from '../../client';
import {
  ColumnAttributes,
  ColumnAttributesWithAfter,
  ColumnAttributesWithForeignKey,
  SqlFunction,
  SqlFunctionTimestamp,
  SqlTypes,
  TableName,
} from '@repo/common-lib/types/database';
import { SQL_FUNCTIONS } from '@repo/common-lib/constants/database';
import { AvailableEnums, EnumType } from '@repo/common-lib/constants/enums';


export const DEFAULT_COLUMN_OPTIONS: ColumnAttributes = {
  nullable: false,
  unique: false,
  primaryKey: false,
};
export class ColumnBuilder {
  protected static validateString(columnName: any): string {
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
  protected static validateLength(length:number){
    if (
      length === undefined ||
      length < 0 ||
      isNaN(length) ||
      length === Infinity ||
      length === -Infinity
    ) {
      throw new Error('Length must be a positive number');
    }
    return length;
  }

  public static id(columnName: string = 'id') {
    return `${this.validateString(columnName || 'id')} ${this.getAutoIncrement(true)}`;
  }
  public static uuid(columnName: string) {
    return `${this.validateString(columnName)} varchar(36) UNIQUE NOT NULL`;
  }
  public static autoIncrement(columnName: string) {
    return `${this.validateString(columnName)} ${this.getAutoIncrement()}`;
  }
  public static getAutoIncrement(isPrimaryKey: boolean = false) {
    switch (getClientConfig()) {
      case 'mysql':
        return isPrimaryKey
          ? 'BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
          : 'BIGINT UNSIGNED UNIQUE AUTO_INCREMENT NOT NULL';
      case 'postgres':
        return isPrimaryKey ? 'SERIAL PRIMARY KEY' : 'SERIAL';
      default:
        throw new Error('Unsupported database client');
    }
  }
  public static integer(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} INTEGER${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static smallInteger(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} SMALLINT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static float(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} REAL${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static double(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} DOUBLE PRECISION${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static decimal(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} DECIMAL${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static bigint(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} BIGINT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static boolean(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} BOOLEAN${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static string(
    columnName: string,
    length: number = 255,
    options?: ColumnAttributes,
  ) {
    
    return `${this.validateString(columnName)} VARCHAR(${this.validateLength(length)}) ${this.buildOptions(options || {})}`;
  }
  public static text(columnName: string, options?: ColumnAttributes) {
    return `${this.validateString(columnName)} TEXT${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static foreignKey(
    columnName: string,
    foreignTableName: TableName,
    foreignTableColumnName: string = 'id',
    options?: ColumnAttributesWithForeignKey,
  ) {
    // If onDelete is SET NULL, the column must be nullable
    const _options = {
      type: 'INTEGER',
      ...options,
      unique: false,
      nullable:
        options?.onDelete || options?.onUpdate ? undefined : options?.nullable,
    };
    return `${this.validateString(columnName)} ${_options.type} ${_options.constraintName ? `CONSTRAINT ${_options.constraintName} ` : ''}REFERENCES ${this.validateString(foreignTableName)} (${this.validateString(foreignTableColumnName)})${!_options.onDelete && !_options.onUpdate ? ' ' + this.buildOptions(_options) : ''}${
      _options.onDelete || _options.onUpdate
        ? ' ' +
          this.buildForeignKeyOptions({
            onDelete: _options.onDelete,
            onUpdate: _options.onUpdate,
          })
        : ''
    }`;
  }
  public static uniques(name:string,uniques:string[]){

    return `CONSTRAINT ${name} UNIQUE (${uniques.join(',')})`


  }

  public static buildOptions(options: ColumnAttributes | ColumnAttributesWithAfter) {
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
    // 4. AFTER (MySQL only)
    if (clientChoosen === 'mysql' && 'after' in _options && _options.after) {
      concatenateOptions(`AFTER ${_options.after}`);
    }

    return optionsString;
  }

  protected static buildForeignKeyOptions(
    options: Pick<ColumnAttributesWithForeignKey, 'onDelete' | 'onUpdate'>,
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
    options?: ColumnAttributes,
  ) {
    // Handle the case where undefined is explicitly passed

    const _options = {
      nullable: false,
      unique: true,
      ...options,
    };
    return `${this.validateString(columnName || 'email')} VARCHAR(255) ${this.buildOptions(_options)}`;
  }
  public static password(columnName: string = 'password') {
    // Handle the case where undefined is explicitly passed
    return `${this.validateString(columnName || 'password')} VARCHAR(255) NOT NULL`;
  }

  public static timestamp(
    columnName: string,
    options: ColumnAttributes<SqlFunctionTimestamp> = {
      nullable: false,
    },
  ) {
    const _options: ColumnAttributes<SqlFunctionTimestamp> = {
      nullable: false,
      ...options,
    };

    const clientConfig = getClientConfig();
    const timestampType = clientConfig === 'postgres' ? 'TIMESTAMPTZ' : 'TIMESTAMP';
    return `${this.validateString(columnName)} ${timestampType} ${this.buildOptions(_options)}`;
  }
  // Function overloads for better type inference
  public static primaryKey(columnName: string, type: SqlTypes) {
    return `${this.validateString(columnName)} ${type} PRIMARY KEY`;
  }
  public static enum(
    columnName: string,
    enumName:  AvailableEnums,
    options?: ColumnAttributes<EnumType<typeof arguments[1]>>,
  ): string {
    return `${this.validateString(columnName)} ${enumName}${options ? ' ' + this.buildOptions(options) : ''}`;
  }
  public static timestamps(
    withSoftDeletes: boolean = false,
    options: ColumnAttributes<SqlFunctionTimestamp> = {
      nullable: false,
      default: 'NOW()',
    },
  ) {
    const _options: ColumnAttributes<SqlFunctionTimestamp> = {
      nullable: false,
      default: 'NOW()',
      ...options,
    };
    const columns = [
      this.timestamp('created_at', _options),
      this.timestamp('updated_at', _options),
    ];
    if (withSoftDeletes) {
      columns.push(this.softDelete());
    }
    return columns;
  }
  public static softDelete(columnName: string = 'deleted_at') {
    const clientConfig = getClientConfig();
    const timestampType = clientConfig === 'postgres' ? 'TIMESTAMPTZ' : 'TIMESTAMP';
    return `${this.validateString(columnName || 'deleted_at')} ${timestampType} NULL`;
  }
}
