import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreateUserSessionInput,
  UpdateUserSessionInput,
  UserSessionSchemaWithUserAuthDevice,
  UserSessionSchemaWithUserAuthDeviceColumns,
  UserSessionSchemaColumns,
} from '@repo/database/schemas/user-sessions';
import { UserSession } from './user-sessions.types';

@Injectable()
export class UserSessionsRepository extends BaseRepository {
  private readonly BASE_COLUMNS: UserSessionSchemaColumns[] = [
    'user_sessions.id',
    'user_sessions.token',
    'user_sessions.user_id',
    'user_sessions.user_auth_device_id',
    'user_sessions.expires_at',
    'user_sessions.created_at',
    'user_sessions.updated_at',
  ] as const;
  private readonly FULL_COLUMNS: UserSessionSchemaWithUserAuthDeviceColumns[] =
    [
      ...this.BASE_COLUMNS,
      'user_auth_devices.id as uad_id',
      'user_auth_devices.user_id as uad_user_id',
      'user_auth_devices.created_at as uad_created_at',
      'user_auth_devices.updated_at as uad_updated_at',
      'user_auth_devices.user_agent',
      'user_auth_devices.ip_address',
      'user_auth_devices.disabled',
      'user_auth_devices.blocked',
    ] as const;
  constructor() {
    super('user_sessions');
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(session: CreateUserSessionInput) {
    const columns = Object.keys(session);
    const values = Object.values(session);
    const result =
      await this.queryBuilder.insertAndGet<UserSessionSchemaWithUserAuthDevice>(
        columns,
        values,
        this.FULL_COLUMNS,
        [
          {
            type: 'LEFT',
            localColumn: 'user_auth_device_id',
            foreignTable: 'user_auth_devices',
            foreignColumn: 'id',
          },
        ],
      );
    return this.formatUserSession(result);
  }
  async update(id: number, updateUserSessionInput: UpdateUserSessionInput) {
    const columns = Object.keys(updateUserSessionInput);
    const values = Object.values(updateUserSessionInput);
    await this.queryBuilder.where('id', '=', id).update(columns, values);
    const result = await this.queryBuilder
      .select(this.FULL_COLUMNS)
      .where('id', '=', id)
      .join('user_auth_device_id', 'user_auth_devices', 'id', 'LEFT')
      .first<UserSessionSchemaWithUserAuthDevice>();
    return this.formatUserSession(result);
  }
  async findOneBySession(session: {
    user_id: number;
    user_auth_device_id?: number;
    token?: string;
  }): Promise<UserSession | null> {
    let query = this.queryBuilder
      .select(this.FULL_COLUMNS)
      .where('user_id', '=', session.user_id)
      .join('user_auth_device_id', 'user_auth_devices', 'id', 'LEFT');
    if (session.user_auth_device_id) {
      query = query.where(
        'user_auth_device_id',
        '=',
        session.user_auth_device_id,
      );
    }
    if (session.token) {
      query = query.where('token', '=', session.token);
    }
    const result =
      await query.first<UserSessionSchemaWithUserAuthDevice | null>();
    return result ? this.formatUserSession(result) : null;
  }
  private formatUserSession(
    userSession: UserSessionSchemaWithUserAuthDevice,
  ): UserSession {
    return {
      id: userSession.id,
      token: userSession.token,
      user_id: userSession.user_id,
      user_auth_device_id: userSession.uad_id,
      expires_at: userSession.expires_at,
      user_auth_device: {
        id: userSession.uad_id,
        user_agent: userSession.user_agent,
        ip_address: userSession.ip_address,
        disabled: userSession.disabled,
        blocked: userSession.blocked,
        user_id: userSession.uad_user_id,
      },
    };
  }
  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
