import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
} from 'class-validator';
import {
  SqlClauseWithoutIn,
  SqlValue,
  TableName,
} from '@repo/common-lib/types/database';
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
    const [tableName, column, extraConditions, customMessage] =
      args.constraints as [
        TableName,
        string,
        ModelNotExistCondition[] | null,
        string | null,
      ];
    const queryBuilder = QueryBuilder.table(tableName);
    try {
      if (extraConditions) {
        for (const [
          conditionColumn,
          conditionOperand,
          conditionValue,
        ] of extraConditions) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          queryBuilder.where(conditionColumn, conditionOperand, conditionValue);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const record = await queryBuilder.where(column, '=', value).exists();
      if (record) {
        this.message =
          customMessage ??
          (extraConditions
            ? `${column} ${value} already exists with ${formatModelNotExistCondition(
                extraConditions,
              )}`
            : `${column} ${value} already exists`);
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

type ModelNotExistCondition = [string, SqlClauseWithoutIn, SqlValue];

type ModelNotExistOptions = {
  extraConditions?: ModelNotExistCondition[] | null;
  message?: string | null;
};

function formatModelNotExistCondition(
  conditions: ModelNotExistCondition[],
) {
  return conditions
    .map(
      ([conditionColumn, conditionOperand, conditionValue]) =>
        `${conditionColumn} ${conditionOperand} ${conditionValue}`,
    )
    .join(', ');
}

export function ModelNotExist(
  tableName: TableName,
  column?: string,
  modelNotExistOptions?: ModelNotExistOptions | null,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'modelNotExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [
        tableName,
        column,
        modelNotExistOptions?.extraConditions ?? null,
        modelNotExistOptions?.message ?? null,
      ],
      options: validationOptions,
      validator: ModelNotExistValidator,
    });
  };
}
