import BaseBuilder from '..';
import { TableName } from '../../constants/types/database';
import { getClientConfig } from '../../client';
import {
  ColumnAttributesWithForeignKey,
  ColumnBuilder,
} from '../columnBuilder';
class AlterBuilder extends BaseBuilder {
  public static table(tableName: TableName) {
    return new AlterBuilder(tableName);
  }
  /**
   * Add a column with a foreign key to the table
   * @param column - The column to add the column to
   * @param foreignTableName - The table to add the column to
   * @param foreignColumnName - The column to add the column to
   * @param options - The options for the column
   */
  public async foreignKeyAdd(
    column: string,
    foreignTableName: TableName,
    foreignColumnName: string,
    options?: ColumnAttributesWithForeignKey,
  ) {
    this.query = `ALTER TABLE ${this.tableName}
ADD ${ColumnBuilder.foreignKey(column, foreignTableName, foreignColumnName, options)};`;
    return await this.db?.query(this.query);
  }

  public async dropForeignKey(constraintName: string) {
    const clientType = getClientConfig();

    if (clientType === 'mysql') {
      this.query = `ALTER TABLE ${this.tableName} DROP FOREIGN KEY ${constraintName};`;
    } else {
      // PostgreSQL, SQL Server, etc.

      this.query = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName};`;
    }

    return await this.db?.query(this.query);
  }

  public async dropConstraint(constraintName: string) {
    this.query = `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${constraintName};`;
    return await this.db?.query(this.query);
  }
  public async dropConstraintIfExists(constraintName: string) {
    this.query = `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${constraintName};`;
    return await this.db?.query(this.query);
  }

  public async addColumn(columnName: string, columnDefinition: string) {
    this.query = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ${columnDefinition};`;
    return await this.db?.query(this.query);
  }
  public async addColumnIfNotExists(
    columnName: string,
    columnDefinition: string,
  ) {
    this.query = `ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition};`;
    return await this.db?.query(this.query);
  }

  public async dropColumn(columnName: string) {
    this.query = `ALTER TABLE ${this.tableName} DROP COLUMN ${columnName};`;
    return await this.db?.query(this.query);
  }
  public async dropColumnIfExists(columnName: string) {
    this.query = `ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS ${columnName};`;
    return await this.db?.query(this.query);
  }

  protected reset() {
    this.query = '';
  }
}

export default AlterBuilder;
