import { ENUMS, } from '../../constants/constants';
import BaseBuilder from '..';
import { AvailableEnums, TableName } from '../../constants/schemas/database';
import { getClient } from '../../client';
import { SchemaBuilderOperationNotAllowedException } from './exceptions';
class SchemaBuilder extends BaseBuilder {
  protected createColumns: string[] = [];
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
    return await this.getDb()?.query(this.query);
  }

  public async createIfNotExists(columns?: (string | string[])[]) {
    this.buildColumns(columns);
    this.buildCreateQuery(true);
    return await this.getDb()?.query(this.query);
  }
  protected buildColumns(columns?: (string | string[])[]) {
    for (const column of columns || []) {
      if (Array.isArray(column)) {
        this.createColumns.push(...column);
      } else {
        this.createColumns.push(column);
      }
    }
  }
  public static async createEnum(enumName: keyof AvailableEnums) {
    const enumValues = ENUMS[enumName].map((value) => `'${value}'`).join(',');
    return await getClient().query(
      `CREATE TYPE ${enumName} AS ENUM (${enumValues});`,
    );
  }
  public static async createEnumIfNotExists(enumName: keyof AvailableEnums) {
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

  public static async dropEnum(enumName: keyof AvailableEnums) {
    if (!getClient().config.settings.allowDrop) {
      throw new SchemaBuilderOperationNotAllowedException(
        'Drop is not allowed, set allowDrop to true in the database config',
      );
    }
    return await getClient().query(`DROP TYPE ${enumName}`);
  }
  public static async dropEnumIfExists(enumName: keyof AvailableEnums) {
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
