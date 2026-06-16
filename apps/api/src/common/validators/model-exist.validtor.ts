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
@ValidatorConstraint({ name: 'modelExist', async: true })
export class ModelExistValidator extends BaseModelValidator {
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
        ModelExistCondition[] | null,
        string | null,
      ];
    const queryBuilder = QueryBuilder.table(tableName);
    let result = false;
    try {
      if (extraConditions) {
        for (const [
          conditionColumn,
          conditionOperand,
          conditionValue,
        ] of extraConditions) {
           
          queryBuilder.where(conditionColumn, conditionOperand, conditionValue);
        }
      }
       
      result = await queryBuilder.where(column, '=', value).exists();
      if (!result) {
        this.message =
          customMessage ??
          (extraConditions
            ? `${tableName} with ${column} ${value} and ${formatModelExistCondition(
                extraConditions,
              )} does not exist`
            : `${tableName} with ${column} ${value} does not exist`);
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

type ModelExistCondition = [string, SqlClauseWithoutIn, SqlValue];

type ModelExistOptions = {
  extraConditions?: ModelExistCondition[] | null;
  message?: string | null;
};

function formatModelExistCondition(conditions: ModelExistCondition[]) {
  return conditions
    .map(
      ([conditionColumn, conditionOperand, conditionValue]) =>
        `${conditionColumn} ${conditionOperand} ${conditionValue}`,
    )
    .join(', ');
}

export function ModelExist(
  tableName: TableName,
  column: string = 'id',
  modelExistOptions?: ModelExistOptions | null,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'modelExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [
        tableName,
        column,
        modelExistOptions?.extraConditions ?? null,
        modelExistOptions?.message ?? null,
      ],
      options: validationOptions,
      validator: ModelExistValidator,
    });
  };
}
