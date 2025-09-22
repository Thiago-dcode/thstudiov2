import { Global, Module } from '@nestjs/common';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
import { mailingConfig, mailingDriver } from 'src/config/mailling';

@Global()
@Module({
  providers: [
    {
        provide: MailService,
        useFactory: () => {
          return FactoryMailService.createMailService(
            mailingDriver,
            mailingConfig,
          );
        },
      },
  ],
  exports: [MailService],
})
export class EmailModule {}
