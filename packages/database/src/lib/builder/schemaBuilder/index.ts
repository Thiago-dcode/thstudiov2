import BaseBuilder from '..';
import { TableName } from '@repo/common-lib/types/database';
import { AvailableEnums, ENUMS } from '@repo/common-lib/constants/enums';
import { getClient } from '../../client';
import { SchemaBuilderOperationNotAllowedException } from './exceptions';
import { createTimeStampsTrigger } from '../../scripts/utils/triggers';
import { ColumnBuilder } from '../columnBuilder';
class SchemaBuilder extends BaseBuilder {
  protected createColumns: string[] = [];
  private timestamps:boolean = false;
  private softDeletes:boolean = false;
  public static table(tableName: TableName) {
    this.throwIfTableNotExists(tableName);
    return new SchemaBuilder(tableName);
  }
  public static async tableIfExists(tableName: TableName) {
    const result = await getClient().query(`SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}')`);
   if(!result?.rows[0]?.exists) {
  return null;
   }
   return new SchemaBuilder(tableName);
  }
  public async create(columns?: (string | string[])[]) {
    // Flatten any arrays (like from timestamps() method)
    this.buildColumns(columns);
    this.buildCreateQuery();

    const result =  await this.getDb()?.query(this.query);
    if(this.timestamps){
      await createTimeStampsTrigger(this.tableName);
    }
    return result;
  }

  public async createIndex(
    columns: string | string[],
    options: {
      name?: string;
      unique?: boolean;
      type?: 'btree' | 'gin' | 'gist' | 'hash';
      where?: string;
    } = {}
  ) {
    const { name, unique = false, type, where } = options;
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const columnArray = Array.isArray(columns) ? columns : [columns];

    // Construct index name if not provided
    const indexName = name || `idx_${this.tableName}_${columnArray.map(col => col.replace(/\s+(DESC|ASC)$/i, '')).join('_')}`;

    let indexQuery = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${this.tableName}`;

    if (type) {
      indexQuery += ` USING ${type.toUpperCase()}`;
    }

    indexQuery += ` (${columnList})`;

    if (where) {
      indexQuery += ` WHERE ${where}`;
    }

    this.query = indexQuery;
    return await this.getDb()?.query(this.query);
  }

  public async createIndexIfNotExists(
    columns: string | string[],
    options: {
      name?: string;
      unique?: boolean;
      type?: 'btree' | 'gin' | 'gist' | 'hash';
      where?: string;
    } = {}
  ) {
    const { name, unique = false, type, where } = options;
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const columnArray = Array.isArray(columns) ? columns : [columns];

    // Construct index name if not provided
    const indexName = name || `idx_${this.tableName}_${columnArray.map(col => col.replace(/\s+(DESC|ASC)$/i, '')).join('_')}`;

    let indexQuery = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${indexName} ON ${this.tableName}`;

    if (type) {
      indexQuery += ` USING ${type.toUpperCase()}`;
    }

    indexQuery += ` (${columnList})`;

    if (where) {
      indexQuery += ` WHERE ${where}`;
    }

    this.query = indexQuery;
    return await this.getDb()?.query(this.query);
  }

  public async dropIndex(indexName: string) {
    this.query = `DROP INDEX ${indexName}`;
    return await this.getDb()?.query(this.query);
  }

  public async dropIndexIfExists(indexName: string) {
    this.query = `DROP INDEX IF EXISTS ${indexName}`;
    return await this.getDb()?.query(this.query);
  }

  public withTimestamps(softDeletes = false){
    this.softDeletes = softDeletes;
    this.timestamps = true;
    return this;
  }
  public async createIfNotExists(columns?: (string | string[])[]) {
    this.buildColumns(columns);
    this.buildCreateQuery(true);
  
    const result = await this.getDb()?.query(this.query);
    if(this.timestamps){
      await createTimeStampsTrigger(this.tableName);
    }
    return result;
  }
  protected  buildColumns(columns?: (string | string[])[]) {
    for (const column of columns || []) {
      if (Array.isArray(column)) {
        this.createColumns.push(...column);
      } else {
        this.createColumns.push(column);
      }
    }
    if(this.timestamps){
      this.createColumns.push(...ColumnBuilder.timestamps(this.softDeletes))
    }
  }
  public static async createEnum(enumName:  AvailableEnums) {
    const enumValues = ENUMS[enumName].map((value) => `'${value}'`).join(',');
    console.log("CREATING ENUM",enumValues)
    return await getClient().query(
      `CREATE TYPE ${enumName} AS ENUM (${enumValues});`,
    );
  }
  public static async createEnumIfNotExists(enumName:  AvailableEnums) {
    const enumValues = ENUMS[enumName].map((value) => `'${value}'`).join(',');
    return await getClient().query(`DO $$ BEGIN
      CREATE TYPE ${enumName} AS ENUM (${enumValues});
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;`);
  }
  public async drop() {
    if (!this.getDb()?.config.settings.allowDrop) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Drop is not allowed, set allowDrop to true in the database config',
      );
    }
    this.query = `DROP TABLE ${this.tableName}`;
    return await this.getDb()?.query(this.query);
  }
  public async dropIfExists() {
    if (!this.getDb()?.config.settings.allowDrop) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Drop is not allowed, set allowDrop to true in the database config',
      );
    }
    this.query = `DROP TABLE IF EXISTS ${this.tableName}`;
    return await this.getDb()?.query(this.query);
  }

  public async truncate() {
    if (!this.getDb()?.config.settings.allowTruncate) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Truncate is not allowed, set allowTruncate to true in the database config',
      );
    }
    this.query = `TRUNCATE TABLE ${this.tableName}`;
    return await this.getDb()?.query(this.query);
  }

  public static async dropEnum(enumName:  AvailableEnums) {
    if (!getClient().config.settings.allowDrop) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Drop is not allowed, set allowDrop to true in the database config',
      );
    }
    return await getClient().query(`DROP TYPE ${enumName}`);
  }
  public static async dropEnumIfExists(enumName:  AvailableEnums) {
    if (!getClient().config.settings.allowDrop) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Drop is not allowed, set allowDrop to true in the database config',
      );
    }
    return await getClient().query(`DROP TYPE IF EXISTS ${enumName}`);
  }

  public async exists(): Promise<boolean> {
    try {
      this.query = `SELECT 1 FROM ${this.tableName} LIMIT 1`;
      const result = await this.getDb()?.query(this.query);
      return !!result;
    } catch (error) {
      console.log('error', error);
      return false;
    }
  }

  protected buildCreateQuery(ifNotExists: boolean = false) {
    this.query = `CREATE TABLE${ifNotExists ? ' IF NOT EXISTS' : ''} ${this.tableName} (${this.createColumns.length > 0 ? '\n' + this.createColumns.join(',\n') : ''}\n);`;
    this.createColumns = [];
  }

  
  protected reset() {
    this.createColumns = [];
    this.query = '';
  }
}

export default SchemaBuilder;
