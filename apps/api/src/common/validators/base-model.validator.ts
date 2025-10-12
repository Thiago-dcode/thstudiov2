import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TableName } from '@repo/database/schemas/database';
import { Injectable } from '@nestjs/common';
import AlterBuilder from '@repo/database/alterBuilder';
import SchemaBuilder from '@repo/database/schemaBuilder';

@Injectable()
@ValidatorConstraint({ name: 'modelExist', async: true })
export class BaseModelValidator implements ValidatorConstraintInterface {
  protected message: string;
  constructor() {}

  async validate(value: any, args: ValidationArguments) {
    //If the value is optional or required, should handle by another validator
    if (value == undefined) return true;
    const [tableName, column = 'id'] = args.constraints as [TableName, string];
    const schemaBuilder = await SchemaBuilder.tableIfExists(tableName);
    if (!schemaBuilder) {
      this.message = `Table ${tableName} does not exist`;
      return false;
    }
    const alterBuilder = AlterBuilder.table(tableName);
    const columnExist = await alterBuilder.columnExist(column);
    if (!columnExist) {
      this.message = `Column ${column} does not exist in ${tableName} or is not of type ${typeof value}`;
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.message;
  }
}
