import { Module } from '@nestjs/common';
import { PasswordRecoveryAttemptsRepository } from './password-recovery-attempts.repository';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [],
  providers: [
    PasswordRecoveryAttemptsRepository,
    PasswordRecoveryAttemptsService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'auth',
        });
      },
    },
  ],
  exports: [PasswordRecoveryAttemptsService],
})
export class PasswordRecoveryAttemptsModule {}