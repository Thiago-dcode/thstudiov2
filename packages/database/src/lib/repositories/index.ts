import { QueryBuilder } from '../builder/queryBuilder';
import { Join, SqlClause, SqlValue, TableName } from '@repo/common-lib/types/database';
import { Query } from '../facades';
import { QueryBuilderException } from '../builder/queryBuilder/exceptions';
type WhereOptions = {column: string, operator: SqlClause, value: SqlValue | SqlValue[]};
type BaseRepositoryOptions = {
  primaryKey?: string;
  softDelete?: boolean;
  softDeleteCol?:string
};
type valueToAttach = string|number;

type AttachValues = {
  [key:valueToAttach]: null |  {
    [col:string]:SqlValue,
  
  }
}

const DEFAULT_OPTIONS: BaseRepositoryOptions = {
  primaryKey: 'id',
  softDelete: false,
  softDeleteCol:"deleted_at"
};
export abstract class BaseRepository {
  protected queryBuilder: QueryBuilder;
  protected options: BaseRepositoryOptions;
  constructor(protected readonly tableName: TableName, options?:BaseRepositoryOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.queryBuilder = new QueryBuilder(this.tableName,this.options.softDelete,this.options.softDeleteCol);
  }

 

  async attach<
  TModelCol extends string,
  TAttachCol extends string
>(
  table: TableName,
  options: {
    modelCol: TModelCol,
    modelValue: valueToAttach,
    attachCol: TAttachCol,
    valuesToAttach: valueToAttach | (valueToAttach)[] | {
      value: valueToAttach,
      columns?: {
        [col: string]: valueToAttach,
      }
    }[]
  }
) {
  const { modelCol, modelValue, attachCol, valuesToAttach } = options;
  
  const _valuesToAttach: AttachValues = !Array.isArray(valuesToAttach) ? {
    [valuesToAttach]:null,
  } : valuesToAttach.reduce((acc:AttachValues,curr)=>{
    if(typeof curr ==='object'){
      acc[curr.value] =curr.columns;
    }else{
      acc[curr] =null
    }
    return acc;
  
  },{} as AttachValues)
  const _values = Object.keys(_valuesToAttach);
  type AttachRecord = Record<TModelCol, valueToAttach> & Record<TAttachCol, valueToAttach>;
  const models: AttachRecord[] = 
    await Query.table(table)
      .select([modelCol, attachCol])
      .where(modelCol, '=', modelValue)
      .whereIn(attachCol,_values )
      .get();
  for (let idx = 0; idx < models.length; idx++) {
    const model = models[idx];
    if(Object.hasOwn(_valuesToAttach,model[attachCol])){
      delete _valuesToAttach[model[attachCol]];
    } 
  }
const result = await Promise.all(Object.entries(_valuesToAttach).map(async([key,value])=>{
  const columns:string[] = [modelCol,attachCol];
  const values: SqlValue[] = [modelValue,key];
  if(value !== null){
    Object.entries(value).forEach(([col,_value])=>{
      columns.push(col);
      values.push(_value);
    })
  }
   return await Query.table(table).insertAndGet(columns,values,[modelCol,attachCol]);
  
  }));
  return result;
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
  async update<T extends Record<string, SqlValue>>(data: T, options: {wheres: WhereOptions[],orWheres?:WhereOptions[],select?: string[] | string, join?: Join[]}) {
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

  private buildQuery(query: QueryBuilder, options?: {select?: string[] | string, join?: Join[], wheres?: WhereOptions[],orWheres?:WhereOptions[]}) {
    if (options?.wheres) {
      for (const {column,operator,value} of options.wheres) {
        const isArray =  Array.isArray(value);
      if(operator !== 'IN'&& operator != 'NOT IN' && isArray){
        throw new QueryBuilderException( `Operator: ${operator} is not compatible with array values: ${value.join(',')}`);
      }
       if(operator !== 'IN' && operator !== 'NOT IN' && !isArray) {
        query = query.where(column, operator, value);
       } else {
      
        if(operator==='IN'){
          query = query.whereIn(column, isArray ? value : [value]);
        }
        else if(operator ==='NOT IN'){
          query = query.whereNotIn(column, isArray ? value : [value]);
        }
       }
      } 
    }
    if(options?.orWheres){
      for (const {column,operator,value} of options.orWheres) {
        const isArray =  Array.isArray(value);
        if(operator !== 'IN'&& operator != 'NOT IN' && isArray){
          throw new QueryBuilderException( `Operator: ${operator} is not compatible with array values: ${value.join(',')}`);
        }
       if(operator !== 'IN' && operator !== 'NOT IN' && !isArray) {
        query = query.orWhere(column, operator, value);
       } else {
      
        if(operator==='IN'){
          query = query.orWhereIn(column, isArray ? value : [value]);
        }
        else if(operator ==='NOT IN'){
          query = query.orWhereNotIn(column, isArray ? value : [value]);
        }
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
