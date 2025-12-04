import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
} from 'class-validator';
import { TableName } from '@repo/common-lib/types/database';
import { DbException } from '@repo/database/exceptions';
import { Injectable } from '@nestjs/common';
import { BaseModelValidator } from './base-model.validator';
import { QueryBuilder } from '@repo/database/queryBuilder';

@Injectable()
@ValidatorConstraint({ name: 'modelExist', async: true })
export class ModelExistValidator extends BaseModelValidator {
  constructor() {
    super();
  }

  async validate(value: any, args: ValidationArguments) {
    if (!(await super.validate(value, args))) {
      return false;
    }
    const [tableName, column] = args.constraints as [TableName, string];
    const queryBuilder = QueryBuilder.table(tableName);
    let result = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      result = await queryBuilder.where(column, '=', value).exists();
      if (!result) {
        this.message = `${tableName} with ${column} ${value} does not exist`;
      }
    } catch (error) {
      this.message =
        error instanceof DbException
          ? `Validation error: ${error.message}`
          : `Validation error: something went wrong`;
    }
    return result;
  }

  defaultMessage() {
    return this.message;
  }
}

export function ModelExist(
  tableName: TableName,
  column: string ='id',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'modelExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [tableName, column],
      options: validationOptions,
      validator: ModelExistValidator,
    });
  };
}
