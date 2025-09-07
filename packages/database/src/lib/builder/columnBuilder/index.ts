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
    if(typeof columnName !== 'string') {
      throw new Error(`Column name must be a string, got ${typeof columnName}`);
    }
   
    const sanitazedColumnName = columnName.trim();
    if (!sanitazedColumnName || sanitazedColumnName.length > 255) {
      throw new Error(`Column name cannot be empty or longer than 255 characters`);
    }
    return sanitazedColumnName;
  }



  public static id(columnName: string = 'id') {
   
    return `${this.validateStringAndReturn(columnName || 'id')} SERIAL PRIMARY KEY AUTOINCREMENT NOT NULL`;
  }

  public static integer(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} INTEGER ${options ? this.buildOptions(options) : ''}`;
  }
  public static bigint(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} BIGINT ${options ? this.buildOptions(options) : ''}`;
  }
  public static boolean(columnName: string, options?: ColumnBuilderOptions) {
    return `${this.validateStringAndReturn(columnName)} BOOLEAN ${options ? this.buildOptions(options) : ''}`;
  }
  public static string(
    columnName: string,
    length: number = 255,
    options?: ColumnBuilderOptions,
  ) {
    return `${this.validateStringAndReturn(columnName)} VARCHAR(${length}) ${options ? this.buildOptions(options) : ''}`;
  }
  public static foreignKey(
    columnName: string,
    tableName: string,
    tableColumnName: string,
    options?: ColumnBuilderOptions,
  ) {
    
    const _options = {
      nullable: false,
      ...options,
    };
    return `${this.validateStringAndReturn(columnName)} INT FOREIGN KEY REFERENCES ${this.validateStringAndReturn(tableName)} (${this.validateStringAndReturn(tableColumnName)}) ${this.buildOptions(_options)}`;
  }
  protected static buildOptions(options: ColumnBuilderOptions) {
    const _options = { ...DEFAULT_COLUMN_OPTIONS, ...options };
    let optionsString = '';
    const concatenateOptions = (options: string) => {
      if(optionsString.length > 0 && options.length > 0) {
        optionsString += ' ';
      }
      optionsString += options;
    }
    for (const [key, value] of Object.entries(_options) as [
      keyof ColumnBuilderOptions,
      any,
    ][]) {
      switch (key) {
        case 'nullable':
         concatenateOptions(value ? 'NULL' : 'NOT NULL');
          break;
        case 'unique':
          concatenateOptions(value ? 'UNIQUE' : '');
          break;
        case 'autoIncrement':
          concatenateOptions(value ? 'AUTOINCREMENT' : '');
          break;
        case 'default':
          if (value !== undefined) {
            concatenateOptions(`DEFAULT ${value === null ? 'NULL' : value}`);
          }
          break;
        case 'onDelete':
          concatenateOptions(value ? `ON DELETE ${value}` : '');
          break;
        case 'onUpdate':
          concatenateOptions(value ? `ON UPDATE ${value}` : '');
          break;
        default:
          break;
      }
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
      default: 'NOW()',
    },
  ) {
    const _options = {
      default: 'NOW()',
      nullable: false,
      ...options,
    };
    return `${this.validateStringAndReturn(columnName)} TIMESTAMP ${this.buildOptions(_options)}`;
  }

  public static timestamps( options: ColumnBuilderOptions = {
    nullable: false,
    default: 'NOW()',
  }) {
    return [
      this.timestamp('created_at', options),
      this.timestamp('updated_at', options),
    ].join(',\n');
  }
  public static softDelete(columnName: string = 'deleted_at') {
    return `${this.validateStringAndReturn(columnName || 'deleted_at')} TIMESTAMP NULL`;
  }
}
