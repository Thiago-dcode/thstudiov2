import { QueryBuilder } from '../builder/queryBuilder';
import { TableName } from '../constants/schemas/database';

export abstract class BaseRepository {
  protected queryBuilder: QueryBuilder;
  constructor(protected readonly tableName: TableName) {
    this.queryBuilder = new QueryBuilder(this.tableName);
  }

  async findAll(filters: any) {
    this.applyFilters(filters);
    return await this.queryBuilder.get();
  }
  abstract applyFilters(filters: any): void;
 
  async findOne<T = any>(id: number) {
    return await this.queryBuilder.where('id', '=', id).first<T>();
  }

  async findOneBy(column: string, value: any) {
    return await this.queryBuilder.where(column, '=', value).first();
  }

  abstract create(data: any): Promise<any>;

 

    
}
