import { ClientNotInitializedException } from '../client/exceptions';
import { getClient, Client } from '../client';
import { QueryBuilderMethodChainedException } from './queryBuilder/exceptions';
import { SqlOperation } from 'lib/types';

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
  constructor(protected readonly tableName: string) {
    this.db = getClient(); // Use the getter function
    if (!this.db) {
      throw new ClientNotInitializedException();
    }
    this.db.connect();
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
  public async raw(query: string, values?: (string | number | null)[]) {
    if (this.operationsChain.length > 0) {
      throw new QueryBuilderMethodChainedException(
        'Method chaining not allowed after raw',
      );
    }
    return await this.db?.query(query, values);
  }
  protected abstract reset(): void;
}

export default BaseBuilder;
