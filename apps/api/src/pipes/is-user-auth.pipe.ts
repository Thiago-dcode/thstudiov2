import {
  PipeTransform,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import { RequestService } from 'src/common/services/request.service';

const ADMIN_ROLE_NAME: EnumType<'USER_ROLE'> = 'ADMIN';

/**
 * Guards `:user_id`-style route params: the caller may only address their **own** id.
 *
 * Admins are the one exception, so support can read a user's own resources. That exception is
 * an *escape hatch*, never an extra requirement — an earlier revision AND-ed the role check
 * onto the id check, which locked every non-admin out of their own metrics, media,
 * notifications and benefits (401 "Not authorized"). Keep the admin clause disjunctive.
 *
 * For routes that only admins may reach at all, use `AdminGuard` instead of this pipe.
 */
@Injectable()
export class IsUserAuthPipe implements PipeTransform {
  constructor(private readonly requestService: RequestService) { }
  async transform(value: any) {
    const user = this.requestService.user;
    const isAdmin = user?.role?.name === ADMIN_ROLE_NAME;
    if (!user || (user.id != value && !isAdmin)) {
      throw new UnauthorizedException('Not authorized');
    }

    return value;
  }
}
