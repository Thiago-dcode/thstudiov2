import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'notIn', async: false })
export class NotInValidator implements ValidatorConstraintInterface {
  protected message = '';

  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null) return true;

    const [forbidden, caseSensitive] = args.constraints as [string[], boolean?];
    const forbiddenSet = new Set(
      (caseSensitive ? forbidden : forbidden.map((v) => String(v).toLowerCase())).map(
        (v) => String(v),
      ),
    );

    const normalizedValue = caseSensitive ? String(value) : String(value).toLowerCase();

    if (forbiddenSet.has(normalizedValue)) {
      this.message = `${value} is not allowed as username`;
      return false;
    }

    return true;
  }

  defaultMessage() {
    return this.message;
  }
}

export function NotIn(
  forbidden: string[],
  validationOptions?: ValidationOptions,
  caseSensitive = false,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'notIn',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [forbidden, caseSensitive],
      options: validationOptions,
      validator: NotInValidator,
    });
  };
}
