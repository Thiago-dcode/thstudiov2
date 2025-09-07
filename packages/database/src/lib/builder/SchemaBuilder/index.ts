import BaseBuilder from '..';

class SchemaBuilder extends BaseBuilder {
  protected columns: string[] = [];

  public static table(tableName: string) {
    return new SchemaBuilder(tableName);
  }

  public async create(columns?: string[]) {
    this.columns = columns || [];
    this.buildCreateQuery();
    return this.db?.query(this.query);
  }
  public async drop() {
    this.query = `DROP TABLE ${this.tableName}`;
    return this.db?.query(this.query);
  }
  public async exists():Promise<boolean> {
    this.query = `SELECT EXISTS (SELECT 1 FROM ${this.tableName})`;
    const result = await this.db?.query(this.query).then((res) => res.rows[0].exists);
    return result;
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
