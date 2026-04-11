import { PartialType } from '@nestjs/mapped-types';
import { CreateUserContactRequest } from './create-user-contact.request';

export class UpdateUserContactRequest extends PartialType(CreateUserContactRequest) {}
