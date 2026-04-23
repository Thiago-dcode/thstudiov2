import { Module } from '@nestjs/common';
import { PasswordRecoveryAttemptsRepository } from './password-recovery-attempts.repository';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [],
  providers: [
    PasswordRecoveryAttemptsRepository,
    PasswordRecoveryAttemptsService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'auth',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [PasswordRecoveryAttemptsService],
})
export class PasswordRecoveryAttemptsModule {}