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
@ValidatorConstraint({ name: 'modelArrayExist', async: true })
export class ModelArrayExistValidator extends BaseModelValidator {
  constructor() {
    super();
  }

  async validate(value: any, args: ValidationArguments) {
    if (!(await super.validate(value, args))) {
      return false;
    }
    if (!Array.isArray(value)) {
      this.message = `Value must be an array, ${typeof value} given`;
      return false;
    }

    const [tableName, column] = args.constraints as [TableName, string];
    const queryBuilder = QueryBuilder.table(tableName);
    let result = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      result =
        (await queryBuilder.whereIn(column || 'id', value).count()) === value.length;
      if (!result) {
        this.message = `Some of the values passed does not exist on ${tableName} and column ${column}`;
      }
    } catch (error) {
      console.log(error)
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

export function ModelArrayExist(
  tableName: TableName,
  column: string ='id',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'modelArrayExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [tableName, column],
      options: validationOptions,
      validator: ModelArrayExistValidator,
    });
  };
}
