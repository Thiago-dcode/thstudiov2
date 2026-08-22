import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { STRIKES_TO_BAN } from '@repo/common-lib/constants/limits';
import { ApiException } from 'src/common/exceptions/api-exception';
import { RequestService } from 'src/common/services/request.service';
import { UserExtraDataService } from 'src/v1/modules/user-extra-data/user-extra-data.service';

@Injectable()
export class UserStrikesGuard implements CanActivate {
  constructor(
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') return true;

    const user = this.requestService.user;
    if (!user) return true;

    const extraData = await this.userExtraDataService.findOneByUserId(user.id);
    if (extraData.account_strikes >= STRIKES_TO_BAN && extraData.ban_lift && new Date(extraData.ban_lift) > new Date()) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(extraData.ban_lift).toISOString()}. Strikes: ${extraData.account_strikes}`,
      );
    }

    return true;
  }
}
