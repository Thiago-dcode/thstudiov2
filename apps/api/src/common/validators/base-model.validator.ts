import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TableName } from '@repo/database/types/database';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import AlterBuilder from '@repo/database/alterBuilder';
import SchemaBuilder from '@repo/database/schemaBuilder';

@Injectable()
@ValidatorConstraint({ name: 'modelExist', async: true })
export class BaseModelValidator implements ValidatorConstraintInterface {
  protected message: string;
  protected queryBuilder: QueryBuilder;
  protected alterBuilder: AlterBuilder;
  protected schemaBuilder: SchemaBuilder;
  protected tableName: TableName;
  protected column: string;
  protected value: any;
  constructor() {}

  async validate(value: any, args: ValidationArguments) {
    //If the value is optional or required, should handle by another validator
    if (value == undefined) return true;
    this.value = value;
    const [tableName, column = 'id'] = args.constraints as [TableName, string];
    this.tableName = tableName;
    this.column = column;
    const schemaBuilder = await SchemaBuilder.tableIfExists(this.tableName);
    if (!schemaBuilder) {
      this.message = `Table ${this.tableName} does not exist`;
      return false;
    }
    this.schemaBuilder = schemaBuilder;
    this.alterBuilder = AlterBuilder.table(this.tableName);
    const columnExist = await this.alterBuilder.columnExist(this.column);
    if (!columnExist) {
      this.message = `Column ${this.column} does not exist in ${this.tableName} or is not of type ${typeof this.value}`;
      return false;
    }
    this.schemaBuilder = SchemaBuilder.table(this.tableName);
    this.queryBuilder = QueryBuilder.table(this.tableName);
  }

  defaultMessage() {
    return this.message;
  }
}
