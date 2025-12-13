import { getClient, Client } from '../client';
import { SqlOperation, TableName } from '@repo/common-lib/types/database';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { DbWrongTableException } from '../exceptions';

abstract class BaseBuilder {
  /** The built SQL query string */
  protected query: string = '';
  /** Chain of operations performed on this query builder */
  protected operationsChain: SqlOperation[] = [];


  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  /**
   * Create a new QueryBuilder instance for the specified table
   * @param tableName - The name of the table to query
   * @throws {ClientNotInitializedException} When database client is not initialized
   */
  constructor(protected readonly tableName: TableName) {
    // Do not access the DB client here; it may not be initialized yet
  }
  /**
   * Execute a raw SQL query
   * @param query - The raw SQL query string
   * @param values - Optional array of values to bind to the query
   * @returns Promise that resolves to the query results
   * @throws {QueryBuilderMethodChainedException} When called after other operations
   * @example
   * ```ts
   * const result = await queryBuilder.raw('SELECT COUNT(*) FROM users WHERE age > ?', [18]);
   * ```
   */
  public static async raw(query: string, values?: (string | number | null)[]) {
    return await getClient().query(query, values);
  }


  public resetQuery(){
    this.query = '';
  }
  public getQuery() {
    return this.query;
  }
  protected abstract reset(): void;

  protected static throwIfTableNotExists(tableName: TableName) {
    if(!Object.values(TABLES_ENUM).includes(tableName)) {
      throw new DbWrongTableException(tableName);
    }
  }

  /** Lazily obtain the DB client when needed */
  protected getDb(): Client<any> {
    return getClient();
  }
}

export default BaseBuilder;
