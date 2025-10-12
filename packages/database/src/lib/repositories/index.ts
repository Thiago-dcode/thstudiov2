import { QueryBuilder } from '../builder/queryBuilder';
import { Join, SqlClause, SqlValue, TableName, WhereType } from '../constants/schemas/database';
type WhereOptions = {column: string, operator: SqlClause, value: SqlValue | SqlValue[], type: WhereType};
type BaseRepositoryOptions = {
  primaryKey?: string;
  softDelete?: boolean;
};
const DEFAULT_OPTIONS: BaseRepositoryOptions = {
  primaryKey: 'id',
  softDelete: false,
};
export abstract class BaseRepository {
  protected queryBuilder: QueryBuilder;
  protected options: BaseRepositoryOptions;
  constructor(protected readonly tableName: TableName, options?:BaseRepositoryOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.queryBuilder = new QueryBuilder(this.tableName);
  }

  async findAll(filters: any) {
    this.applyFilters(filters);
    return await this.queryBuilder.get();
  }
  abstract applyFilters(filters: any): void;
 
  async findOne<T = any>(id: number, options?: {select?: string[] | string, join?: Join[]}) {
    let query = this.queryBuilder.where(this.options.primaryKey, '=', id);
    query = this.buildQuery(query, options);
    return await query.first<T>();
  }

  protected async _findOneBy<T = any>(column: string, value: any,options?: {select?: string[] | string, join?: Join[]}) {
    let query = this.queryBuilder.where(column, '=', value);
    query = this.buildQuery(query, options);
    return await query.first<T>();
  }

  protected async _create<T = any>(data: Record<string, SqlValue>,options?: {select?: string[] | string, join?: Join[]}): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    return await this.queryBuilder.insertAndGet<T>(columns, values,options?.select,options?.join);
   }


  async exists(data: {[column: string]: any}, options?: { join?: Join[]}) {
    let query = this.queryBuilder;
    for (const [column, value] of Object.entries(data)) {
      if (value !== undefined) {
        query = query.where(column, '=', value);
      }
    }
    query = this.buildQuery(query, options);
    return await query.exists();
  }
  async update(data: Record<string, SqlValue>, options: {wheres: WhereOptions[],select?: string[] | string, join?: Join[]}) {
    let query = this.buildQuery(this.queryBuilder, options);
    const columns = Object.keys(data);
    const values = Object.values(data);
    return await query.update(columns, values);
  }

  async updateOne(id: number|string, data: Record<string, SqlValue>) {
    const columns = Object.keys(data);
    const values = Object.values(data);
   const result = await this.queryBuilder.where(this.options.primaryKey, '=', id).update(columns, values);
   return result;
  }

  private buildQuery(query: QueryBuilder, options?: {select?: string[] | string, join?: Join[], wheres?: WhereOptions[]}) {
    if (options?.wheres) {
      for (const where of options.wheres) {
       if(where.operator !== 'IN' && where.operator !== 'NOT IN' && typeof where.value === 'string') {
        query = query.where(where.column, where.operator, where.value);
       } else {
        query = query.whereIn(where.column, Array.isArray(where.value) ? where.value : [where.value]);
       }
      } 
    }
    if (options?.select) {
      query = query.select(options.select);
    }
    if (options?.join) {
      for (const join of options.join) {
        query = query.join(join.localColumn, join.foreignTable, join.foreignColumn, join.type);
      }
    }
    return query;
  }
 

    
}
