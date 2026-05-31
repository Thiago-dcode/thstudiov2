import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { NotifyNewUserMail } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';
import { EmailPreferencesModule } from 'src/v1/modules/email-preferences/email-preferences.module';

@Module({
  imports: [EmailPreferencesModule],
  controllers: [TestController],
  providers: [NotifyNewUserMail, UserRepository],
})
export class TestModule {}
