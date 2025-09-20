import BaseBuilder from '..';
import { getClient } from '../../client';
import {
  Where,

  SqlClauseWithoutIn,
  Join,
  JoinType,
  WhereCondition,
  WhereInCondition,
  SqlOperation,
  SqlValue,
  WhereType,
} from '../../constants/schemas/database';
import {
  QueryBuilderMethodChainedException,
  QueryBuilderOperationNotAllowedException,
  QueryBuilderWrongColumnException,
  QueryBuilderWrongColumnsException,
  QueryBuilderWrongDatabaseClientException,
} from './exceptions';
import { TABLES } from '../../constants/constants';

/**
 * QueryBuilder class for building and executing SQL queries
 *
 * This class provides a fluent interface for building SQL queries with support for:
 * - SELECT operations with joins and WHERE clauses
 * - INSERT operations
 * - UPDATE operations with WHERE clauses
 * - DELETE operations with WHERE clauses
 * - Raw SQL execution
 *
 * The QueryBuilder automatically handles parameter binding and database-specific syntax
 * for PostgreSQL and MySQL databases.
 *
 * @example
 * ```ts
 * // Initialize the database client first
 * init({ host: 'localhost', port: 5432, username: 'user', password: 'pass', database: 'db', client: 'postgres' });
 *
 * // Create a query builder instance
 * const queryBuilder = new QueryBuilder('users');
 *
 * // Build and execute a SELECT query(order matters)
 * const users = await queryBuilder
 *   .select(['id', 'name', 'email'])
 *   .where('status', '=', 'active')
 *   .join('department_id', 'departments', 'id')
 *   .get();
 *
 * // Execute an INSERT query
 * queryBuilder.insert(['name', 'email'], ['John Doe', 'john@example.com']);
 *
 * // Execute an UPDATE query
 * queryBuilder
 *   .where('id', '=', 1)
 *   .update(['name'], ['Jane Doe']);
 *
 * // Execute a DELETE query
 * queryBuilder
 *   .where('status', '=', 'inactive')
 *   .delete();
 * ```
 */
export class QueryBuilder extends BaseBuilder {
  // ============================================================================
  // PROTECTED PROPERTIES
  // ============================================================================

  /** Current position in the values array for parameter binding */
  protected valuesPosition: number = 0;

  /** Array of values to bind to the query parameters */
  protected values: SqlValue[] = [];

  /** SELECT clause columns (defaults to '*') */
  protected _select: string = '*';

  /** Array of WHERE conditions */
  protected wheres: Where[] = [];

  /** Array of JOIN conditions */
  protected joins: Join[] = [];

  /** Limit for the query */
  protected _limit: number = 0;

  /** Offset for the query */
  protected _offset: number = 0;

  /** Order by for the query */
  protected _orderBy: string = '';

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(protected readonly tableName: (typeof TABLES)[number]) {
    super(tableName);
  }

  // ============================================================================
  // PUBLIC QUERY EXECUTION METHODS
  // ============================================================================

  /**
   * Execute the built SELECT query and return the results
   * @returns Promise that resolves to the query results
   * @example
   * ```ts
   * const users = await queryBuilder
   *   .select(['id', 'name'])
   *   .where('status', '=', 'active')
   *   .get();
   * ```
   */
  public async get<T = any>(): Promise<T> {
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rows;
  }
  public async count(): Promise<number> {
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rowCount;
  }
  public async first<T = any>(): Promise<T> {
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rows[0];
  }
  public async exists(): Promise<boolean> {
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rowCount > 0;
  }

  public static table(tableName: (typeof TABLES)[number]) {
    this.throwIfTableNotExists(tableName);
    return new QueryBuilder(tableName);
  }

  /**
   * Execute an INSERT query
   * @param columns - Array of column names to insert into
   * @param values - Array of values to insert (must match columns length)
   * @throws {QueryBuilderWrongColumnsException} When columns and values length mismatch
   * @throws {QueryBuilderMethodChainedException} When incompatible operations exist
   * @example
   * ```ts
   * queryBuilder.insert(['name', 'email', 'age'], ['John Doe', 'john@example.com', 25]);
   * ```
   */
  public async insert(columns: string[], values: SqlValue[]) {
    this.buildInsertQuery(columns, values);
    const result = await getClient().query(this.query, values);
    this.reset();
    return result;
  }
  public async insertAndGet<T = any>(
    columns: string[],
    values: SqlValue[],
    select: string[] | string = '*',
  ): Promise<T> {
    this.buildInsertQuery(columns, values);
   await getClient().query(this.query, values);
    this.reset();
    columns.forEach((column, index) => {
      const value = values[index];
      const operator = value === null ? 'IS' : '=';
      
      this.where(column, operator, value);
    });
    this.select(select);
    const result = await this.first();
    return result;
  }

  /**
   * Execute an UPDATE query
   * @param columns - Array of column names to update
   * @param values - Array of values to update (must match columns length)
   * @throws {QueryBuilderWrongColumnsException} When columns and values length mismatch
   * @throws {QueryBuilderMethodChainedException} When incompatible operations exist
   * @throws {QueryBuilderOperationNotAllowedException} When no WHERE clause and allowUpdateWithoutWhere is false
   * @example
   * ```ts
   * queryBuilder
   *   .where('id', '=', 1)
   *   .update(['name', 'email'], ['Jane Doe', 'jane@example.com']);
   * ```
   */
  public async update(columns: string[], values: SqlValue[]) {
    this.buildUpdateQuery(columns, values);
    const result = await getClient().query(this.query, values);
    this.reset();
    return result;
  }

  /**
   * Execute a DELETE query
   * @throws {QueryBuilderMethodChainedException} When incompatible operations exist
   * @throws {QueryBuilderOperationNotAllowedException} When no WHERE clause and allowDeleteWithoutWhere is false
   * @example
   * ```ts
   * queryBuilder
   *   .where('status', '=', 'inactive')
   *   .delete();
   * ```
   */
  public async delete() {
    this.buildDeleteQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rowCount > 0;
  }

  // ============================================================================
  // PUBLIC QUERY BUILDING METHODS
  // ============================================================================

  /**
   * Set the columns to select from the table
   * @param columns - Array of column names or comma-separated string of column names
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.select(['id', 'name', 'email']);
   * queryBuilder.select('id,name,email,foreignTable.id');
   * ```
   */
  public select(columns: string[] | string = []) {
    this.operationsChain.push('select');
    const columnsToArray = Array.isArray(columns)
      ? columns
      : columns.split(',');
    const cleanedColumns = columnsToArray.reduce((acc, column) => {
      if (typeof column != 'string') {
        return acc;
      }
      const sanitazedColumn = this.buildColumn(column);
      if (sanitazedColumn.length) {
        acc.push(sanitazedColumn);
      }
      return acc;
    }, [] as string[]);
    this._select = cleanedColumns.length ? cleanedColumns.join(',') : '*';
    return this;
  }

  /**
   * Add a WHERE clause to the query
   * @param column - The column name to filter on
   * @param operator - The comparison operator (=, >, <, >=, <=, !=, LIKE, IS, IS NOT)
   * @param value - The value to compare against
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.where('age', '>=', 18);
   * queryBuilder.where('name', 'LIKE', '%John%');
   * queryBuilder.where('deleted_at', 'IS', null);
   * ```
   */
  private handlePushWhere(column: string, operator: SqlClauseWithoutIn, value: SqlValue, type:WhereType) {
    this.operationsChain.push('where');
    if(value !== null) this.values.push(value);
     this.wheres.push({
       column,
       operator,
       position: value !== null ? this.valuesPosition++ : -1,
       type,
       value,
     } as WhereCondition);
    
  }
  public where(column: string, operator: SqlClauseWithoutIn, value: SqlValue) {
    this.handlePushWhere(column, operator, value, 'where');
    return this;
  }

  /**
   * Add an OR WHERE clause to the query
   * @param column - The column name to filter on
   * @param operator - The comparison operator
   * @param value - The value to compare against
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder
   *   .where('status', '=', 'active')
   *   .orWhere('role', '=', 'admin');
   * ```
   */
  public orWhere(
    column: string,
    operator: SqlClauseWithoutIn,
    value: SqlValue,
  ) {
    this.handlePushWhere(column, operator, value,this.wheres.length === 0? 'where' : 'orWhere');
    return this;
  }

  private handlePushWhereIn(column: string, values: SqlValue[], type:WhereType) {
    this.operationsChain.push('where');
    this.values.push(...values);
    const startPosition = this.valuesPosition;
    this.valuesPosition += values.length;
    this.wheres.push({
      column,
      position: startPosition,
      values,
      type,
      operator: 'IN',
    });
  }
  /**
   * Add a WHERE IN clause to the query
   * @param column - The column name to filter on
   * @param values - Array of values to match against
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.whereIn('status', ['active', 'pending', 'review']);
   * ```
   */
  public whereIn(column: string, values: SqlValue[]) {
    this.handlePushWhereIn(column, values, 'where');
    return this;
  }

  /**
   * Add an OR WHERE IN clause to the query
   * @param column - The column name to filter on
   * @param values - Array of values to match against
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder
   *   .where('category', '=', 'tech')
   *   .orWhereIn('status', ['active', 'pending']);
   * ```
   */
  public orWhereIn(column: string, values: SqlValue[]) {
    this.handlePushWhereIn(column, values, this.wheres.length === 0? 'where' : 'orWhere');
    return this;
  }

  /**
   * Join a table to the current table
   * @param localColumn - The column in the current table
   * @param foreignTable - The table to join
   * @param foreignColumn - The column in the foreign table
   * @param joinType - The type of join (INNER, LEFT, RIGHT, FULL)
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.join('user_id', 'users', 'id', 'INNER');
   * queryBuilder.join('department_id', 'departments', 'id', 'LEFT');
   * ```
   */
  public join(
    localColumn: string,
    foreignTable: string,
    foreignColumn: string,
    joinType: JoinType = 'INNER',
  ) {
    this.operationsChain.push('join');
    this.joins.push({
      type: joinType,
      localColumn,
      foreignTable,
      foreignColumn,
    });
    return this;
  }

  // ============================================================================
  // PROTECTED QUERY BUILDING METHODS
  // ============================================================================

  /**
   * Build the SELECT query string
   * @protected
   */

  public limit(limit: number) {
    this.operationsChain.push('limit');
    this._limit = limit;
    return this;
  }

  public offset(offset: number) {
    this.operationsChain.push('offset');
    this._offset = offset;
    return this;
  }

  public orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC') {
    this.operationsChain.push('orderBy');
    this._orderBy = `${column} ${order}`;
    return this;
  }

  protected buildSelectQuery() {
    this.query = `SELECT ${this._select} FROM ${this.tableName}`;
    if (this.joins.length > 0) {
      this.query += `${this.joins
        .map((join) => {
          return ` \n${this.buildJoinQuery(join)}`;
        })
        .join('')}`;
    }

    // Build WHERE clause
    this.query += this.buildWheresQuery(this.wheres);
    if (this._orderBy) {
      this.query += ` \nORDER BY ${this._orderBy}`;
    }
    if (this._limit) {
      this.query += ` \nLIMIT ${this._limit}`;
    }
    if (this._offset) {
      this.query += ` \nOFFSET ${this._offset}`;
    }
  }

  /**
   * Build the INSERT query string
   * @param columns - Array of column names
   * @param values - Array of values
   * @protected
   */
  protected buildInsertQuery(columns: string[], values: SqlValue[]) {
    this.throwIfColumnsAndValuesLengthMismatch(columns, values);
    this.throwIfNotCompatibleOperations([], 'insert');
    switch (getClient().config.client) {
      case 'postgres':
        this.query = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${values.map((_, index) => `$${index + 1}`).join(',')})`;
        break;
      case 'mysql':
        this.query = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${values.map(() => `?`).join(',')})`;
        break;
      default:
        throw new QueryBuilderWrongDatabaseClientException(
          getClient().config.client,
        );
    }
  }

  /**
   * Build the UPDATE query string
   * @param columns - Array of column names
   * @param values - Array of values
   * @protected
   */
  protected buildUpdateQuery(columns: string[], values: SqlValue[]) {
    this.throwIfColumnsAndValuesLengthMismatch(columns, values);
    this.throwIfNotCompatibleOperations(['where'], 'update');
    this.throwIfOperationNotAllowed(
      !this.operationsChain.includes('where') &&
        !getClient().config.settings.allowUpdateWithoutWhere,
      'update',
    );
    switch (getClient().config.client) {
      case 'postgres':
        this.query = `UPDATE ${this.tableName} SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(',')}`;
        break;
      case 'mysql':
        this.query = `UPDATE ${this.tableName} SET ${columns.map((column) => `${column} = ?`).join(',')}`;
        break;
    }
    this.query += this.buildWheresQuery(this.wheres, columns.length);
  }

  /**
   * Build the DELETE query string
   * @protected
   */
  protected buildDeleteQuery() {
    this.throwIfNotCompatibleOperations(['where'], 'delete');
    this.throwIfOperationNotAllowed(
      !this.operationsChain.includes('where') &&
        !getClient().config.settings.allowDeleteWithoutWhere,
      'delete',
    );
    this.query = `DELETE FROM ${this.tableName}`;
    this.query += this.buildWheresQuery(this.wheres);
  }

  /**
   * Build the WHERE clause string from WHERE conditions
   * @param wheres - Array of WHERE conditions
   * @param offset - Offset for parameter position (used in UPDATE queries)
   * @returns The WHERE clause string
   * @protected
   */
  protected buildWheresQuery(wheres: Where[], offset: number = 0) {
    if (!wheres.length) return '';
    return (
      ' \nWHERE' +
      wheres
        .map((where, index) => {
          let whereQuery = '';
          if (where.operator !== 'IN' && where.operator !== 'NOT IN') {
            whereQuery = this.buildWhereQuery(where as WhereCondition, offset);
          } else if (
            (where.operator === 'IN' || where.operator === 'NOT IN') &&
            'values' in where
          ) {
            whereQuery = this.buildWhereInQuery(where, offset);
          }

          if (index === 0) {
            whereQuery = ` ${whereQuery}`;
          } else {
            if (where.type === 'orWhere') {
              whereQuery = ` \nOR ${whereQuery}`;
            } else {
              whereQuery = ` \nAND ${whereQuery}`;
            }
          }
          return whereQuery;
        })
        .join('')
    );
  }

  /**
   * Build a single WHERE condition query string
   * @param where - The WHERE condition
   * @param offset - Offset for parameter position
   * @returns The WHERE condition string
   * @protected
   */
  protected buildWhereQuery(where: WhereCondition, offset: number = 0) {
    switch (getClient().config.client) {
      case 'postgres':
        let append = `$${where.position + offset + 1}`;
        if (where.value === null) {
          append = 'NULL';
        }
        return `${this.buildColumn(where.column)} ${where.operator} ${append}`;
      case 'mysql':
        return `${this.buildColumn(where.column)} ${where.operator} ?`;
      default:
        throw new QueryBuilderWrongDatabaseClientException(
          getClient().config.client,
        );
    }
  }

  /**
   * Build a WHERE IN condition query string
   * @param where - The WHERE IN condition
   * @param offset - Offset for parameter position
   * @returns The WHERE IN condition string
   * @protected
   */
  protected buildWhereInQuery(where: WhereInCondition, offset: number = 0) {
    switch (getClient().config.client) {
      case 'postgres':
        return `${this.buildColumn(where.column)} IN (${where.values.map((_, index) => `$${where.position + offset + index + 1}`).join(',')})`;
      case 'mysql':
        return `${this.buildColumn(where.column)} IN (${where.values.map(() => `?`).join(',')})`;
      default:
        throw new QueryBuilderWrongDatabaseClientException(
          getClient().config.client,
        );
    }
  }

  /**
   * Build a JOIN query string
   * @param join - The JOIN condition
   * @returns The JOIN query string
   * @protected
   */
  protected buildJoinQuery(join: Join) {
    return `${join.type} JOIN ${join.foreignTable} ON ${join.foreignTable}.${join.foreignColumn} = ${this.tableName}.${join.localColumn}`;
  }

  // ============================================================================
  // PROTECTED UTILITY METHODS
  // ============================================================================

  /**
   * Build and sanitize a column name with table prefix
   * @param column - The column name to sanitize
   * @returns The sanitized column name
   * @throws {QueryBuilderWrongColumnException} When column name has more than 2 parts
   * @protected
   */
  protected buildColumn(column: string) {
    const sanitazedColumn = column.trim();
    if (!sanitazedColumn.length) {
      return '';
    }
    const splitedColumn = sanitazedColumn.split('.');
    if (splitedColumn.length > 2) {
      throw new QueryBuilderWrongColumnException(
        'Wrong column name: ' + sanitazedColumn,
      );
    }
    if (splitedColumn.length === 2) {
      return `${splitedColumn[0]}.${splitedColumn[1]}`;
    } else {
      return `${this.tableName}.${sanitazedColumn}`;
    }
  }

  /**
   * Reset the query builder state
   * @protected
   */
  protected reset() {
    this.query = '';
    this.values = [];
    this.valuesPosition = 0;
    this.operationsChain = [];
    this.wheres = [];
    this.joins = [];
    this._limit = 0;
    this._offset = 0;
    this._orderBy = '';
  }

  // ============================================================================
  // PROTECTED VALIDATION METHODS
  // ============================================================================

  /**
   * Throw an exception if columns and values arrays have different lengths
   * @param columns - Array of column names
   * @param values - Array of values
   * @throws {QueryBuilderWrongColumnsException} When lengths don't match
   * @protected
   */
  protected throwIfColumnsAndValuesLengthMismatch(
    columns: string[],
    values: SqlValue[],
  ) {
    if (columns.length !== values.length) {
      throw new QueryBuilderWrongColumnsException(
        'Columns and values must have the same length',
      );
    }
  }

  /**
   * Throw an exception if an operation is not allowed
   * @param condition - Boolean condition that triggers the exception
   * @param operation - The operation name for the error message
   * @throws {QueryBuilderOperationNotAllowedException} When condition is true
   * @protected
   */
  protected throwIfOperationNotAllowed(
    boolean: boolean | undefined,
    operation: string,
  ) {
    if (boolean) {
      throw new QueryBuilderOperationNotAllowedException(
        'Can not ' +
          operation +
          ' without where clause, if you want to ' +
          operation +
          ' without where clause, you must set allow' +
          operation +
          'WithoutWhere to true in the database config',
      );
    }
  }

  /**
   * Throw an exception if incompatible operations exist in the chain
   * @param compatibleOperations - Array of operations that are compatible
   * @param methodName - The method name for the error message
   * @throws {QueryBuilderMethodChainedException} When incompatible operations exist
   * @protected
   */
  protected throwIfNotCompatibleOperations(
    compatibleOperations: SqlOperation[],
    methodName: string,
  ) {
    const incompatibleOperations = this.operationsChain.filter(
      (operation) => !compatibleOperations.includes(operation),
    );
    if (incompatibleOperations.length > 0) {
      throw new QueryBuilderMethodChainedException(
        'Method chaining not allowed before ' +
          methodName +
          ', you can only chain operations: ' +
          compatibleOperations.join(', '),
      );
    }
  }
}
