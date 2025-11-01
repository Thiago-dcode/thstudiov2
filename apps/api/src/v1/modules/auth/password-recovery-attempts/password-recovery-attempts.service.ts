import { Injectable } from '@nestjs/common';
import { PasswordRecoveryAttemptsRepository } from './password-recovery-attempts.repository';
import {
  CreatePasswordRecoveryAttemptInput,
  UpdatePasswordRecoveryAttemptInput,
} from '@repo/common-lib/schemas/password-recovery-attempt';

@Injectable()
export class PasswordRecoveryAttemptsService {
  constructor(
    private readonly passwordRecoveryAttemptsRepository: PasswordRecoveryAttemptsRepository,
  ) {}
  async create(data: CreatePasswordRecoveryAttemptInput) {
    return await this.passwordRecoveryAttemptsRepository.create(data);
  }
  async update(id: number, data: UpdatePasswordRecoveryAttemptInput) {
    return await this.passwordRecoveryAttemptsRepository.updateOne(id, data);
  }
  async expireAllUserAttempts(userId: number) {
    return await this.passwordRecoveryAttemptsRepository.update(
      {
        user_id: userId,
        expires_at: new Date(),
      },
      {wheres: [{column: 'user_id', operator: '=', value: userId,type: 'where'}]},
    );
  }
  async findOneNotExpiredByUserId(userId: number) {
    return await this.passwordRecoveryAttemptsRepository.findNotExpiredByUserId(userId);
  }
  async findOneByCode(code: string) {
    return await this.passwordRecoveryAttemptsRepository.findOneByCode(code);
  }
  async findOneById(id: number) {
    return await this.passwordRecoveryAttemptsRepository.findOneById(id);
  }
}
