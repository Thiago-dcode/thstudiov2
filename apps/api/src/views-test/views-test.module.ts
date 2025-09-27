import { Module } from '@nestjs/common';
import { ViewsTestController } from './views-test.controller';
import { NotifyNewUserMail } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';

@Module({
  controllers: [ViewsTestController],
  providers: [NotifyNewUserMail, UserRepository],
})
export class ViewsTestModule {}
