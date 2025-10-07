import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ENUMS, AvailableEnums } from '@repo/common-lib/constants/enums';

@Injectable()
@ValidatorConstraint({ name: 'isAvailableEnum', async: true })
export class IsEnumValidator implements ValidatorConstraintInterface {
  protected message: string;
  async validate(value: any, args: ValidationArguments) {
    const [enumType] = args.constraints as [AvailableEnums];
    if (!Object.values(ENUMS[enumType]).includes(value)) {
      this.message = `${value} is not a valid value for ${enumType}: ${Object.values(ENUMS[enumType]).join(', ')}`;
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.message;
  }
}
export function IsAvailableEnum(
  enumType: AvailableEnums,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAvailableEnum',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumType],
      options: validationOptions,
      validator: IsEnumValidator,
    });
  };
}
