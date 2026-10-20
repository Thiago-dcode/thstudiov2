import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserContactRequest } from './create-user-contact.request';

// No `user_id`: the owner comes from the route, and accepting it here let an artist move one of
// their contacts into another artist's inbox (the whitelist pipe now strips it).
export class UpdateUserContactRequest extends PartialType(
  OmitType(CreateUserContactRequest, ['user_id'] as const),
) {}
