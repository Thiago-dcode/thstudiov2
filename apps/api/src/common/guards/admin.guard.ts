import {
  CanActivate,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Query } from '@repo/database/facades';
import { RequestService } from 'src/common/services/request.service';

/** Must match {@link RoleSchema} `name` for platform admins (`ENUMS.USER_ROLE`). */
const ADMIN_ROLE_NAME: EnumType<'USER_ROLE'> = 'ADMIN';

/**
 * Requires an authenticated user whose `role.name` is `ADMIN` (see `USER_ROLE` in common-lib).
 * Use only on admin controllers. Runs after global {@link AuthGuard}: controller guards execute
 * after global guards, so `RequestService.user` is populated when this runs.
 *
 * The token's role claim is only the first filter: it lives as long as the token, so a demoted
 * (or banned) admin would keep admin access until expiry. The role is re-read from the database.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly requestService: RequestService) { }

  async canActivate(): Promise<boolean> {
    const user = this.requestService.user;

    if (!user?.role?.name || user.role.name !== ADMIN_ROLE_NAME) {
      throw new ForbiddenException();
    }

    const result = await Query.raw(
      `SELECT r.name FROM ${TABLES_ENUM.USERS} u
       INNER JOIN ${TABLES_ENUM.ROLES} r ON r.id = u.role_id
       WHERE u.id = $1 AND u.banned = false
       LIMIT 1`,
      [user.id],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const current = (Array.isArray(rows) ? rows[0] : undefined) as { name?: string } | undefined;
    if (current?.name !== ADMIN_ROLE_NAME) {
      throw new ForbiddenException();
    }

    return true;
  }
}
