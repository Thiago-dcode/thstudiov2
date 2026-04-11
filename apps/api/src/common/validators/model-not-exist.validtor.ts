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
@ValidatorConstraint({ name: 'modelNotExist', async: true })
export class ModelNotExistValidator extends BaseModelValidator {
  constructor() {
    super();
  }

  async validate(value: any, args: ValidationArguments) {
    if (!(await super.validate(value, args))) {
      return false;
    }
    const [tableName, column] = args.constraints as [TableName, string];
    const queryBuilder = QueryBuilder.table(tableName);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const record = await queryBuilder.where(column, '=', value).exists();
      if (record) {
        this.message = `${column} ${value} already exists`;
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof DbException) {
        this.message = `Validation error: ${error.message}`;
      } else {
        this.message = `Validation error: something went wrong`;
      }
      return false;
    }
  }

  defaultMessage() {
    return this.message;
  }
}

export function ModelNotExist(
  tableName: TableName,
  column?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'modelNotExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [tableName, column],
      options: validationOptions,
      validator: ModelNotExistValidator,
    });
  };
}
