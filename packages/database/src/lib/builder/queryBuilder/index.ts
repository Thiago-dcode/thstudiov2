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
  TableName,
  SqlClause,
} from '@repo/common-lib/types/database';
import {
  QueryBuilderMethodChainedException,
  QueryBuilderOperationNotAllowedException,
  QueryBuilderWrongColumnException,
  QueryBuilderWrongColumnsException,
  QueryBuilderWrongDatabaseClientException,
} from './exceptions';

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

  /** Geo filter for radius-based queries */
  protected _geoFilter: {
    latColumn: string;
    lngColumn: string;
    lat: number;
    lng: number;
    radiusKm: number;
  } | null = null;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(protected readonly tableName: TableName, protected _softDeletes = false, protected _softDeleteCol = 'deleted_at', protected _primaryKey = 'id') {
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
  public async get<T = any>(resetQuery = true): Promise<T> {
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    if (resetQuery) this.reset();
    else {
      this.query = '';
    }
    return result.rows;
  }
  public async count(resetQuery = true): Promise<number> {
    const selectTemp = this._select;
    const orderByTemp = this._orderBy;
    this._select = `count(${this.tableName}.*)`;
    this._orderBy = '';
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    if (resetQuery) this.reset();
    else {
      this.query = '';
      this._select = selectTemp;
      this._orderBy = orderByTemp;
    }
    return parseInt(result.rows[0].count);
  }

  public async first<T = any>(): Promise<T> {
    // Only one row is ever returned, so say so in SQL instead of letting the database
    // materialise every match and discarding all but the first in JS.
    if (!this._limit) this._limit = 1;
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rows[0] ?? null;
  }
  public async exists(): Promise<boolean> {
    this.rawSelect('1');
    this.buildSelectQuery();
    const result = await getClient().query(this.query, this.values);
    this.reset();
    return result.rowCount > 0;
  }

  public softDeletes(softDelete: boolean, softDeleteCol = "deleted_at") {
    this._softDeletes = softDelete;
    this._softDeleteCol = softDeleteCol;
    return this;
  }

  public static table(tableName: TableName) {
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
    const result = await getClient().query(this.query, values.filter((value) => value !== null));
    this.reset();
    return result;
  }
  /**
   * Execute an INSERT and return the row that was just written.
   *
   * The row is identified by `RETURNING`, never by matching the payload back: two
   * concurrent inserts of an identical payload are indistinguishable by their columns,
   * and the INSERT and any follow-up SELECT run on different pooled connections with no
   * transaction between them, so a payload-equality read-back can hand back another
   * request's row.
   */
  public async insertAndGet<T = any>(
    columns: string[],
    values: SqlValue[],
    select: string[] | string = '*',
    join: Join[] = [],
  ): Promise<T> {
    const params = values.filter((value) => value !== null);

    if (getClient().config.client === 'postgres') {
      // Without joins the inserted row already answers the query, so RETURNING makes
      // this a single statement — nothing can interleave between write and read.
      if (!join.length) {
        this.buildInsertQuery(columns, values, this.sanitizeSelect(select));
        const result = await getClient().query(this.query, params);
        this.reset();
        return result.rows[0] ?? null;
      }

      // Joins can't be expressed in RETURNING, so fall back to a second query — but key
      // it on the primary key RETURNING just gave us rather than on the payload.
      this.buildInsertQuery(columns, values, this.buildColumn(this._primaryKey));
      const inserted = await getClient().query(this.query, params);
      const id = inserted.rows[0]?.[this._primaryKey];
      this.reset();
      return await this.selectByPrimaryKey<T>(id, select, join);
    }

    // MySQL has no RETURNING; the ResultSetHeader's insertId identifies the row instead.
    this.buildInsertQuery(columns, values);
    const result = await getClient().query(this.query, params);
    const id = Array.isArray(result) ? result[0]?.insertId : result?.insertId;
    this.reset();
    return await this.selectByPrimaryKey<T>(id, select, join);
  }

  private async selectByPrimaryKey<T = any>(id: SqlValue, select: string[] | string = '*', join: Join[] = []): Promise<T> {
    this.reset();
    this.where(this._primaryKey, '=', id);
    this.select(select);
    this.joins.push(...join);
    return await this.first<T>();
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
  public async update(columns: string[], values: SqlValue[], resetQuery = true) {
    this.buildUpdateQuery(columns, values);
    const result = await getClient().query(this.query, this.values);
    if (resetQuery) this.reset();
    else {
      this.query = '';
      const unshiftedCount = values.filter((value) => value !== null).length;
      this.values.splice(0, unshiftedCount);
    }
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

    if (!this._softDeletes) {
      return this.__forceDelete();
    }
    this.update([this._softDeleteCol], [new Date()]);
  }
  public async __forceDelete() {
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
    this.throwIfInIncompatibleOperations(['select'], 'select');
    this.operationsChain.push('select');
    this._select = this.sanitizeSelect(columns);
    return this;
  }

  /**
   * Normalise a column list into a SELECT/RETURNING clause without touching builder state.
   * `select()` records an operation in the chain, which `buildInsertQuery` rejects, so the
   * INSERT ... RETURNING path needs the sanitising without the bookkeeping.
   */
  private sanitizeSelect(columns: string[] | string = []) {
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
    return cleanedColumns.length ? cleanedColumns.join(',') : '*';
  }
  public rawSelect(select: string) {
    this.throwIfInIncompatibleOperations(['select'], 'rawSelect');
    this.operationsChain.push('select');
    this._select = select;
    return this;
  }

  /**
   * Add a WHERE clause to the query.
   * Two-arg form defaults to `=` (same as `where(column, '=', value)`).
   * @param column - The column name to filter on
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.where('status', 'active'); // status = 'active'
   * queryBuilder.where('age', '>=', 18);
   * queryBuilder.where('name', 'LIKE', '%John%');
   * queryBuilder.where('deleted_at', 'IS', null);
   * ```
   */
  private handlePushWhere(column: string, operator: SqlClauseWithoutIn, value: SqlValue, type: WhereType, startGroup?: boolean, endGroup?: boolean) {
    this.operationsChain.push('where');
    const isNull = value === null;
    if (!isNull) this.values.push(value);
    this.wheres.push({
      column,
      operator: isNull ? operator === '=' ? 'IS' : operator === '!=' ? 'IS NOT' : operator : operator,
      position: isNull ? -1 : this.valuesPosition++,
      type,
      value,
      startWhereGroup: startGroup,
      endWhereGroup: endGroup
    } as WhereCondition);

  }
  public whereGroup(wheres: [string, SqlClause, SqlValue | SqlValue[], WhereType][]) {

    for (let i = 0; i < wheres.length; i++) {
      const [col, clause, value, type] = wheres[i];
      const start = i === 0;
      const end = wheres.length - 1 === i;
      if ((clause === 'IN' || clause == 'NOT IN')) {
        const _value = Array.isArray(value) ? value : [value];
        this.handlePushWhereIn(col, clause, _value, type, start, end);
        continue;
      }
      this.handlePushWhere(col, clause, value as string, type, start, end);
    }

    return this;


  }
  public where(column: string, value: SqlValue): this;
  public where(
    column: string,
    operator: SqlClauseWithoutIn,
    value: SqlValue,
  ): this;
  public where(
    column: string,
    operatorOrValue: SqlClauseWithoutIn | SqlValue,
    value?: SqlValue,
  ): this {
    if (arguments.length === 2) {
      this.handlePushWhere(column, '=', operatorOrValue as SqlValue, 'where');
    } else {
      this.handlePushWhere(
        column,
        operatorOrValue as SqlClauseWithoutIn,
        value as SqlValue,
        'where',
      );
    }
    return this;
  }


  /**
   * Add an OR WHERE clause to the query.
   * Two-arg form defaults to `=`.
   * @param column - The column name to filter on
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder
   *   .where('status', 'active')
   *   .orWhere('role', 'admin');
   * ```
   */
  public orWhere(column: string, value: SqlValue): this;
  public orWhere(
    column: string,
    operator: SqlClauseWithoutIn,
    value: SqlValue,
  ): this;
  public orWhere(
    column: string,
    operatorOrValue: SqlClauseWithoutIn | SqlValue,
    value?: SqlValue,
  ): this {
    const type: WhereType =
      this.wheres.length === 0 ? 'where' : 'orWhere';
    if (arguments.length === 2) {
      this.handlePushWhere(column, '=', operatorOrValue as SqlValue, type);
    } else {
      this.handlePushWhere(
        column,
        operatorOrValue as SqlClauseWithoutIn,
        value as SqlValue,
        type,
      );
    }
    return this;
  }

  private handlePushWhereIn(column: string, operator: 'IN' | 'NOT IN', values: SqlValue[], type: WhereType, startGroup?: boolean, endGroup?: boolean) {
    this.operationsChain.push('where');
    this.values.push(...values);
    const startPosition = this.valuesPosition;
    this.valuesPosition += values.length;
    this.wheres.push({
      column,
      position: startPosition,
      values,
      type,
      operator,
      startWhereGroup: startGroup,
      endWhereGroup: endGroup
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
    this.handlePushWhereIn(column, 'IN', values, 'where');
    return this;
  }

  /**
   * Add a WHERE NOT IN clause to the query
   * @param column - The column name to filter on
   * @param values - Array of values to exclude
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder.whereNotIn('status', ['deleted', 'archived']);
   * ```
   */
  public whereNotIn(column: string, values: SqlValue[]) {
    this.handlePushWhereIn(column, 'NOT IN', values, 'where');
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
    this.handlePushWhereIn(column, 'IN', values, this.wheres.length === 0 ? 'where' : 'orWhere');
    return this;
  }

  /**
   * Add an OR WHERE NOT IN clause to the query
   * @param column - The column name to filter on
   * @param values - Array of values to exclude
   * @returns This QueryBuilder instance for method chaining
   * @example
   * ```ts
   * queryBuilder
   *   .where('category', '=', 'tech')
   *   .orWhereNotIn('status', ['deleted', 'archived']);
   * ```
   */
  public orWhereNotIn(column: string, values: SqlValue[]) {
    this.handlePushWhereIn(column, 'NOT IN', values, this.wheres.length === 0 ? 'where' : 'orWhere');
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
    foreignTable: TableName,
    foreignColumn: string = 'id',
    joinType: JoinType = 'INNER',
    onSuffix?: string,
  ) {
    this.operationsChain.push('join');
    this.joins.push({
      type: joinType,
      localColumn,
      foreignTable,
      foreignColumn,
      onSuffix,
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
    if (!this.operationsChain.includes('limit')) {
      this.operationsChain.push('limit');
    }
    this._limit = limit;
    return this;
  }

  public offset(offset: number) {
    this.operationsChain.push('offset');
    this._offset = offset;
    return this;
  }
  public random() {
    this._orderBy = 'RANDOM()';
  }
  public orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC') {
    this.operationsChain.push('orderBy');
    const newOrder = `${this.buildColumn(column)} ${order}`;
    if (this._orderBy) {
      this._orderBy = `${this._orderBy}, ${newOrder}`;
    } else {
      this._orderBy = newOrder;
    }
    return this;
  }

  /**
   * Filter rows within a radius (km) from a lat/lng point.
   * Uses a bounding-box pre-filter + Haversine for precision.
   */
  public withinRadius(
    latColumn: string,
    lngColumn: string,
    lat: number,
    lng: number,
    radiusKm: number,
  ) {
    this._geoFilter = { latColumn, lngColumn, lat, lng, radiusKm };
    return this;
  }

  /**
   * Order results by Haversine distance from a lat/lng point.
   */
  public orderByDistance(
    latColumn: string,
    lngColumn: string,
    lat: number,
    lng: number,
    order: 'ASC' | 'DESC' = 'ASC',
  ) {
    this.operationsChain.push('orderBy');
    const latCol = this.buildColumn(latColumn);
    const lngCol = this.buildColumn(lngColumn);
    this._orderBy = `${this.geoHaversineExpr(latCol, lngCol, lat, lng)} ${order}`;
    return this;
  }

  /**
   * Add the Haversine distance (km) as a computed column in SELECT.
   */
  public selectDistance(
    latColumn: string,
    lngColumn: string,
    lat: number,
    lng: number,
    alias = 'distance_km',
  ) {
    const latCol = this.buildColumn(latColumn);
    const lngCol = this.buildColumn(lngColumn);
    const expr = `${this.geoHaversineExpr(latCol, lngCol, lat, lng)} AS ${alias}`;
    this._select = this._select === '*' ? `*, ${expr}` : `${this._select}, ${expr}`;
    return this;
  }

  protected setSoftDelete() {
    if (this._softDeletes) {
      this.where(this._softDeleteCol, null);
    }
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

    this.setSoftDelete();

    this.query += this.buildWheresQuery(this.wheres);
    this.query += this.buildGeoFilterQuery();
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

  private geoHaversineExpr(latCol: string, lngCol: string, lat: number, lng: number): string {
    return (
      `(2 * 6371 * asin(sqrt(` +
      `power(sin(radians(${lat} - ${latCol}) / 2), 2) + ` +
      `cos(radians(${lat})) * cos(radians(${latCol})) * ` +
      `power(sin(radians(${lng} - ${lngCol}) / 2), 2))))`
    );
  }

  protected buildGeoFilterQuery(): string {
    if (!this._geoFilter) return '';
    const { latColumn, lngColumn, lat, lng, radiusKm } = this._geoFilter;
    const latCol = this.buildColumn(latColumn);
    const lngCol = this.buildColumn(lngColumn);

    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    const prefix = this.wheres.length > 0 ? ' \nAND' : ' \nWHERE';

    return (
      `${prefix} ${latCol} BETWEEN ${lat - latDelta} AND ${lat + latDelta}` +
      ` \nAND ${lngCol} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}` +
      ` \nAND ${this.geoHaversineExpr(latCol, lngCol, lat, lng)} <= ${radiusKm}`
    );
  }

  /**
   * Build the INSERT query string
   * @param columns - Array of column names
   * @param values - Array of values
   * @param returning - Columns to append as a RETURNING clause (Postgres only; MySQL has no RETURNING)
   * @protected
   */
  protected buildInsertQuery(columns: string[], values: SqlValue[], returning?: string) {
    this.throwIfColumnsAndValuesLengthMismatch(columns, values);
    this.throwIfNotInCompatibleOperations([], 'insert');
    let offset = 0;
    this.query = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${values.map((_, index) => {
      const isNull = values[index] === null;
      offset = isNull ? offset : offset + 1;
      switch (getClient().config.client) {
        case 'postgres':
          return `${isNull ? 'NULL' : `$${offset}`}`;
        case 'mysql':
          return `${isNull ? 'NULL' : `?`}`;
        default:
          throw new QueryBuilderWrongDatabaseClientException(
            getClient().config.client,
          );
      }
    }).join(',')})`;

    if (returning && getClient().config.client === 'postgres') {
      this.query += ` RETURNING ${returning}`;
    }
  }

  /**
   * Build the UPDATE query string
   * @param columns - Array of column names
   * @param values - Array of values
   * @protected
   */
  protected buildUpdateQuery(columns: string[], values: SqlValue[]) {
    this.removeNonWhereOps();
    this.throwIfColumnsAndValuesLengthMismatch(columns, values);
    this.throwIfNotInCompatibleOperations(['where', 'limit', 'orderBy', 'offset'], 'update');
    this.throwIfOperationNotAllowed(
      !this.operationsChain.includes('where') &&
      !getClient().config.settings.allowUpdateWithoutWhere,
      'update',
    );
    this.values.unshift(...values.filter((value) => value !== null));
    let offset = 0;
    this.query = `UPDATE ${this.tableName} SET ${columns.map((column, index) => {
      const isNull = values[index] === null;
      offset = isNull ? offset : offset + 1;
      switch (getClient().config.client) {
        case 'postgres':
          return `${column} = ${isNull ? 'NULL' : `$${offset}`}`;
        case 'mysql':
          return `${column} = ${isNull ? 'NULL' : `?`}`;
        default:
          throw new QueryBuilderWrongDatabaseClientException(
            getClient().config.client,
          );
      }
    }).join(',')}`;

    this.setSoftDelete();

    if (this._limit || this._orderBy) {
      const subquery = this.buildLimitedUpdateSubquery(offset);
      this.query += ` \nWHERE ctid IN (${subquery})`;
    } else {
      this.query += this.buildWheresQuery(this.wheres, offset);
    }
  }

  private buildLimitedUpdateSubquery(offset: number): string {
    let sub = `SELECT ctid FROM ${this.tableName}`;
    sub += this.buildWheresQuery(this.wheres, offset);
    if (this._orderBy) {
      sub += ` \nORDER BY ${this._orderBy}`;
    }
    if (this._limit) {
      sub += ` \nLIMIT ${this._limit}`;
    }
    if (this._offset) {
      sub += ` \nOFFSET ${this._offset}`;
    }
    return sub;
  }

  /**
   * Build the DELETE query string
   * @protected
   */
  protected buildDeleteQuery() {
    this.throwIfNotInCompatibleOperations(['where'], 'delete');
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

          if (where.startWhereGroup) {
            whereQuery = `(${whereQuery}`;
          }
          if (where.endWhereGroup) {
            whereQuery = `${whereQuery})`;
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
    const operator = where.operator; // 'IN' or 'NOT IN'
    switch (getClient().config.client) {
      case 'postgres':
        return `${this.buildColumn(where.column)} ${operator} (${where.values.map((_, index) => `$${where.position + offset + index + 1}`).join(',')})`;
      case 'mysql':
        return `${this.buildColumn(where.column)} ${operator} (${where.values.map(() => `?`).join(',')})`;
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
    const on = `${join.foreignTable}.${join.foreignColumn} = ${this.buildColumn(join.localColumn)}`;
    const suffix = join.onSuffix?.trim() ? ` ${join.onSuffix.trim()}` : '';
    return `${join.type} JOIN ${join.foreignTable} ON ${on}${suffix}`;
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
    // A parenthesis means this is a SQL expression (LOWER(title), unaccent(addresses.city),
    // COUNT(*)), not an identifier. Prefixing it with the table name produces
    // `portfolios.LOWER(title)`, which Postgres reads as a schema-qualified function call.
    // Callers of the expression form qualify their own columns.
    if (sanitazedColumn.includes('(')) {
      return sanitazedColumn;
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

  protected removeNonWhereOps() {
    this._select = '*';
    this.operationsChain = this.operationsChain.filter(
      (op) => op === 'where' || op === 'limit' || op === 'orderBy' || op === 'offset',
    );
  }

  /**
   * Reset the query builder state
   * @protected
   */
  public reset() {
    this._select = '*';
    this.query = '';
    this.values = [];
    this.valuesPosition = 0;
    this.operationsChain = [];
    this.wheres = [];
    this.joins = [];
    this._limit = 0;
    this._offset = 0;
    this._orderBy = '';
    this._geoFilter = null;
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
    if (!columns.length || !values.length || columns.length !== values.length) {
      throw new QueryBuilderWrongColumnsException(
        'Columns and values must have the same length and greater than 1',
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
  protected throwIfNotInCompatibleOperations(
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
        compatibleOperations.join(', ') +
        '. Current chain: ' +
        this.operationsChain.join(', '),
      );
    }
  }
  protected throwIfInIncompatibleOperations(
    incompatibleOperations: SqlOperation[],
    methodName: string,
  ) {
    for (const operation of incompatibleOperations) {
      if (this.operationsChain.includes(operation)) {
        throw new QueryBuilderMethodChainedException(
          'Incompatible operation: ' + operation + ' with ' + methodName,
        );
      }
    }

  }
}
