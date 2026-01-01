import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestService } from '../services/request.service';

@Injectable()
@ValidatorConstraint({ name: 'isUserAuth', async: true })
export class IsUserAuthValidator implements ValidatorConstraintInterface {
  protected message = '';
  constructor(private readonly requestService: RequestService) {}

  async validate(value: any) {

    const user = this.requestService.user;
    if(!user || user.id != value){
      throw new UnauthorizedException();
    };


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
