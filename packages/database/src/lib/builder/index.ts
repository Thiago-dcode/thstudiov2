import { ClientNotInitializedException } from 'lib/client/exceptions';
import client, { Client } from 'lib/client';

abstract class BaseBuilder {
  /** The built SQL query string */
  protected query: string = '';

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
    this.db = client;
    if (!this.db) {
      throw new ClientNotInitializedException();
    }
    this.db.connect();
  }

  protected abstract reset(): void;
}

export default BaseBuilder;
