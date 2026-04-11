import { Module } from '@nestjs/common';
import { PasswordRecoveryAttemptsRepository } from './password-recovery-attempts.repository';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts.service';

@Module({
  controllers: [],
  providers: [PasswordRecoveryAttemptsRepository, PasswordRecoveryAttemptsService],
  exports: [PasswordRecoveryAttemptsService],
})
export class PasswordRecoveryAttemptsModule {}