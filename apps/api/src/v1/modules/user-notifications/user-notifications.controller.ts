import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
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

  /**
   * A dedicated route rather than a general update: `read_at` is the only field a client may
   * change, and it is the server that decides when "now" is.
   */
  @Patch(':id/read')
  markAsRead(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    user_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userNotificationsService.markAsRead(id, user_id);
  }
}
