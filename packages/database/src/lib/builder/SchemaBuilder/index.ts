import { Client } from 'lib/client';
import BaseBuilder from '..';

class SchemaBuilder extends BaseBuilder {
  protected columns: string[] = [];

  public static table(tableName: string) {
    return new SchemaBuilder(tableName);
  }

  public create(columns?: string[]) {
    this.columns = columns || [];
    this.buildCreateQuery();
    return this.db?.query(this.query);
  }

  protected buildCreateQuery() {
    this.query = `CREATE TABLE ${this.tableName} (${this.columns.join(',')}`;

    this.query += `);`;
  }

  protected reset() {
    this.columns = [];
    this.query = '';
  }
}
export default SchemaBuilder;
