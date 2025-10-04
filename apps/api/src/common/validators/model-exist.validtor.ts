import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
} from 'class-validator';
import { TableName } from '@repo/database/schemas/database';
import { DbException } from '@repo/database/exceptions';
import { Injectable } from '@nestjs/common';
import { BaseModelValidator } from './base-model.validator';

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
    let result = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      result = await this.queryBuilder.where(this.column, '=', value).exists();
      if (!result) {
        this.message = `${this.tableName} with ${this.column} ${value} does not exist`;
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
  column?: string,
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
