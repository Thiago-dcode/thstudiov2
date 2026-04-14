import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { UserSubscriptionService } from './user-subscription.service';

@Controller('users')
export class UserSubscriptionController {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Get(':id/subscription')
  async findActive(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.userSubscriptionService.findActiveSubscription(id);
  }
}
