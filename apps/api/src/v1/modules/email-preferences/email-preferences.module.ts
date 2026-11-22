import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_PREFERENCES_QUEUE } from '@repo/common-lib/constants/queues';
import { EmailPreferencesRepository } from './email-preferences.repository';
import { EmailPreferencesService } from './email-preferences.service';
import { EmailPreferencesProcessor } from './email-preferences.processor';
import { EmailPreferencesController } from './email-preferences.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_PREFERENCES_QUEUE }),
  ],
  providers: [
    EmailPreferencesRepository,
    EmailPreferencesService,
    EmailPreferencesProcessor,
  ],
  controllers: [EmailPreferencesController],
  exports: [EmailPreferencesService],
})
export class EmailPreferencesModule { }
