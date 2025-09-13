import { ENUMS, TABLES } from '../../constants/constants';
import BaseBuilder from '..';
import { AvailableEnums } from '../../constants/types';
import { getClient } from '../../client';
class SchemaBuilder extends BaseBuilder {
  protected columns: string[] = [];

  public static table(tableName: (typeof TABLES)[number]) {
    return new SchemaBuilder(tableName);
  }

  public async create(columns?: (string | string[])[]) {
    // Flatten any arrays (like from timestamps() method)
    this.buildColumns(columns);
    this.buildCreateQuery();
    return await this.db?.query(this.query);
  }

  public async createIfNotExists(columns?: (string | string[])[]) {
    this.buildColumns(columns);
    this.buildCreateQuery(true);
    return await this.db?.query(this.query);
  }
  protected buildColumns(columns?: (string | string[])[]) {
    for (const column of columns || []) {
      if (Array.isArray(column)) {
        this.columns.push(...column);
      } else {
        this.columns.push(column);
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
    this.query = `DROP TABLE ${this.tableName}`;
    return await this.db?.query(this.query);
  }
  public async dropIfExists() {
    this.query = `DROP TABLE IF EXISTS ${this.tableName}`;
    return await this.db?.query(this.query);
  }

  public static async dropEnum(enumName: keyof AvailableEnums) {
    return await getClient().query(`DROP TYPE ${enumName}`);
  }
  public static async dropEnumIfExists(enumName: keyof AvailableEnums) {
    return await getClient().query(`DROP TYPE IF EXISTS ${enumName}`);
  }

  public async exists(): Promise<boolean> {
    try {
      this.query = `SELECT 1 FROM ${this.tableName} LIMIT 1`;
      const result = await this.db?.query(this.query);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  protected buildCreateQuery(ifNotExists: boolean = false) {
    this.query = `CREATE TABLE${ifNotExists ? ' IF NOT EXISTS' : ''} ${this.tableName} (${this.columns.length > 0 ? '\n' + this.columns.join(',\n') : ''}\n);`;
    this.columns = [];
  }

  protected reset() {
    this.columns = [];
    this.query = '';
  }
}

export default SchemaBuilder;
