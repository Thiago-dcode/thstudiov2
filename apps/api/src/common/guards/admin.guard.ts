import {
  CanActivate,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import { RequestService } from 'src/common/services/request.service';

/** Must match {@link RoleSchema} `name` for platform admins (`ENUMS.USER_ROLE`). */
const ADMIN_ROLE_NAME: EnumType<'USER_ROLE'> = 'ADMIN';

/**
 * Requires an authenticated user whose `role.name` is `ADMIN` (see `USER_ROLE` in common-lib).
 * Use only on admin controllers. Runs after global {@link AuthGuard}: controller guards execute
 * after global guards, so `RequestService.user` is populated when this runs.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly requestService: RequestService) { }

  canActivate(): boolean {
    const user = this.requestService.user;


    if (!user?.role?.name || user.role.name !== ADMIN_ROLE_NAME) {
      throw new ForbiddenException();
    }

    return true;
  }
}
