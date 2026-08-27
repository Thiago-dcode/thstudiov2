import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreatePasswordRecoveryAttemptInput,
  PasswordRecoveryAttemptColumns,
  PasswordRecoveryAttemptColumnsWithUser,
  PasswordRecoveryAttemptSchema,
  PasswordRecoveryAttemptSchemaWithUser,
} from '@repo/common-lib/schemas/password-recovery-attempt';

@Injectable()
export class PasswordRecoveryAttemptsRepository extends BaseRepository {
  private readonly BASE_COLUMNS: PasswordRecoveryAttemptColumns[] = [
    'password_recovery_attempts.id',
    'password_recovery_attempts.user_id',
    'password_recovery_attempts.code',
    'password_recovery_attempts.expires_at',
    'password_recovery_attempts.created_at',
    'password_recovery_attempts.updated_at',
  ];
  private readonly COLUMNS_WITH_USER: PasswordRecoveryAttemptColumnsWithUser[] =
    [
      'password_recovery_attempts.id',
      'password_recovery_attempts.user_id',
      'password_recovery_attempts.code',
      'password_recovery_attempts.code_validated',
      'password_recovery_attempts.expires_at',
      'password_recovery_attempts.created_at',
      'password_recovery_attempts.updated_at',
      'users.email',
      'users.username',
    ];
  constructor() {
    super('password_recovery_attempts');
  }

  async findOneById(id: number) {
    return await this.query()
      .where('id', '=', id)
      .select(this.COLUMNS_WITH_USER)
      .join('user_id', 'users', 'id', 'LEFT')
      .first<PasswordRecoveryAttemptSchemaWithUser>();
  }
  async create(data: CreatePasswordRecoveryAttemptInput) {
    return await super._create<PasswordRecoveryAttemptSchema>(data);
  }
  async findNotExpiredByUserId(userId: number) {
    return await this.query()
      .where('user_id', '=', userId)
      .where('expires_at', '>', new Date())
      .select(this.BASE_COLUMNS)
      .first<PasswordRecoveryAttemptSchema>();
  }
  async findOneByCode(code: string) {
    const result = await this.query()
      .where('code', '=', code)
      .select(this.COLUMNS_WITH_USER)
      .join('user_id', 'users', 'id', 'LEFT')
      .first<PasswordRecoveryAttemptSchemaWithUser>();
    return {
      id: result.id,
      code: result.code,
      code_validated: result.code_validated,
      expires_at: result.expires_at,
      created_at: result.created_at,
      updated_at: result.updated_at,
      user: {
        email: result.email,
        username: result.username,
        id: result.user_id,
      },
    };
  }

  async existsByDevice(device: {
    email: string;
    user_agent: string;
    ip_address: string;
    code?: string;
  }) {
    return await super.exists(
      {
        email: device.email,
        ['user_auth_devices.user_agent']: device.user_agent,
        ['user_auth_devices.ip_address']: device.ip_address,
        code: device?.code,
      },
      {
        join: [
          {
            localColumn: 'user_auth_device_id',
            foreignTable: 'user_auth_devices',
            foreignColumn: 'id',
            type: 'LEFT',
          },
        ],
      },
    );
  }
}
