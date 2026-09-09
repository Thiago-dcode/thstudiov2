import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { RequestService } from '../services/request.service';

@Injectable()
@ValidatorConstraint({ name: 'isUserAuth', async: true })
export class IsUserAuthValidator implements ValidatorConstraintInterface {
  protected message = '';
  constructor(private readonly requestService: RequestService) {
  }

  async validate(value: any) {

    const user = this.requestService.user;
    if (!user || user.id != value) {
      // `user` is null for an unauthenticated request, so it cannot be dereferenced here:
      // doing so threw a TypeError and surfaced as a 500 instead of this 400.
      this.message = user
        ? `User with id: ${user.id} is not authorized to use the user id: ${value}`
        : `No authenticated user to authorize the user id: ${value}`;
      return false;
    }


    return true;
  }

  defaultMessage() {
    return this.message;
  }

}

export function IsUserAuth(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUserAuth',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsUserAuthValidator,
    });
  };
}
