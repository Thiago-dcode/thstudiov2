import client, { Client } from './clients';
import { ClientNotInitializedException } from './exceptions';
import { WhereOperator } from './types';

export class QueryBuilder {
  protected db: Client<any> | null = null;
  public query: string = '';
  protected _select: string = '';
  protected _wheres: string[] = [];
  protected _orWheres: string[] = [];
  constructor(protected readonly tableName: string) {
    console.log('client', client);
    this.db = client;
    if (!this.db) {
      throw new ClientNotInitializedException();
    }
    this.db.connect();
  }
  public async get(): Promise<any> {
    return await this.db?.query(this.query);
  }
  public async raw(query: string) {
    return await this.db?.query(query);
  }
  public select(values: string[] = []) {
    this._select = values.length > 0 ? values.join(',') : '*';
    return this;
  }

  public where(value: string, operator: WhereOperator, value2: string) {
    this._wheres.push(`${value} ${operator} ${value2}`);
    return this;
  }

  public orWhere(value: string, operator: WhereOperator, value2: string) {
    this._orWheres.push(`${value} ${operator} ${value2}`);
    return this;
  }
  protected buildSelectQuery() {
    this.query = `SELECT ${this._select} FROM ${this.tableName}`;
    if (this._wheres.length > 0) {
      this.query += ` WHERE ${this._wheres.join(' AND ')}`;
    }
    if (this._orWheres.length > 0) {
      this.query += ` OR ${this._orWheres.join(' OR ')}`;
    }
  }
}
