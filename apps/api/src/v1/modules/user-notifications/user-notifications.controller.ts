import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { IndexUserNotificationRequest } from './requests/index-user-notification.request';
import { UserNotificationsService } from './user-notifications.service';

@Controller('users/:user_id/notifications')
export class UserNotificationsController {
  constructor(
    private readonly userNotificationsService: UserNotificationsService,
  ) { }

  @Get()
  getAll(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    user_id: number,
    @Query() filters: IndexUserNotificationRequest,
  ) {
    return this.userNotificationsService.getAll(user_id, filters);
  }

  @Get(':id')
  getOne(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    user_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userNotificationsService.getOne(id, user_id);
  }
}
