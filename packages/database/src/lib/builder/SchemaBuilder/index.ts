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
  public async exists(): Promise<boolean> {
    try {
      this.query = `SELECT 1 FROM ${this.tableName} LIMIT 1`;
      const result = await this.db?.query(this.query);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  protected buildCreateQuery() {
    this.query = `CREATE TABLE ${this.tableName} (${this.columns.length > 0 ? '\n' + this.columns.join(',\n') : ''}\n);`;
  }

  protected reset() {
    this.columns = [];
    this.query = '';
  }
}
export default SchemaBuilder;
