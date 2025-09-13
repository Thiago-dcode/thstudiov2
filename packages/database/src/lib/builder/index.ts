import { ClientNotInitializedException } from '../client/exceptions';
import { getClient, Client } from '../client';
import { SqlOperation } from 'lib/constants/types';
import { TABLES } from 'lib/constants/constants';

abstract class BaseBuilder {
  /** The built SQL query string */
  protected query: string = '';
  /** Chain of operations performed on this query builder */
  protected operationsChain: SqlOperation[] = [];
  /** The database client instance */
  protected db: Client<any> | null = null;
  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  /**
   * Create a new QueryBuilder instance for the specified table
   * @param tableName - The name of the table to query
   * @throws {ClientNotInitializedException} When database client is not initialized
   */
  constructor(protected readonly tableName: (typeof TABLES)[number]) {
    this.db = getClient(); // Use the getter function
    if (!this.db) {
      throw new ClientNotInitializedException();
    }
    // Don't connect here - the client should already be connected
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
  protected getQuery() {
    return this.query;
  }
  protected abstract reset(): void;
}

export default BaseBuilder;
