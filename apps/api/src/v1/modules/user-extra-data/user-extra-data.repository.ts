import { Injectable } from '@nestjs/common';
import { UserExtraDataRepository as BaseUserExtraDataRepository } from '@repo/database/repositories/user-extra-data';

/**
 * Nest wrapper around the shared user_extra_data repository.
 * All methods live on the database base class (no HTTP-only queries).
 */
@Injectable()
export class UserExtraDataRepository extends BaseUserExtraDataRepository {
  constructor() {
    super();
  }
}
