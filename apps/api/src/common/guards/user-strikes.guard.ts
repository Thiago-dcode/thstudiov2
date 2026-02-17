import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/api-exception';
import { RequestService } from 'src/common/services/request.service';
import { UserExtraDataService } from 'src/v1/modules/user-extra-data/user-extra-data.service';
import { MAX_ACCOUNT_MONTHLY_STRIKES } from '@repo/common-lib/constants/constants';

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
    if (extraData.account_strikes >= MAX_ACCOUNT_MONTHLY_STRIKES) {
      throw ApiException.accountStrikesExceeded(
        `Account suspended due to repeated policy violations. Strikes: ${extraData.account_strikes}/${MAX_ACCOUNT_MONTHLY_STRIKES}`,
      );
    }

    return true;
  }
}
