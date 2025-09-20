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
    await super.validate(value, args);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const record = await this.queryBuilder
        .where(this.column, '=', this.value)
        .exists();
      if (!record) {
        this.message = `${this.value} does not exist`;
      }
      return record;
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
