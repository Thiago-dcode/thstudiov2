import { Module } from '@nestjs/common';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { UserEmailPreferenceController } from './user-email-preferences.controller';

@Module({
  imports: [EmailPreferencesModule],
  controllers: [UserEmailPreferenceController],
})
export class UserEmailPreferencesModule {}
