import { Injectable } from '@nestjs/common';
import { Query } from '@repo/database/facades';
import { BaseRepository } from '@repo/database/repositories';
import { UserAuthDeviceSchemaColumns } from '@repo/common-lib/schemas/user-session';
import { UserAuthDevice } from '@repo/common-lib/types/user-session';
import {
  CreateUserAuthDeviceInput,
  UpdateUserAuthDeviceInput,
} from '@repo/common-lib/types/user-session';

@Injectable()
export class UserAuthDevicesRepository extends BaseRepository {
  private readonly COLUMNS: UserAuthDeviceSchemaColumns[] = [
    'user_auth_devices.id',
    'user_auth_devices.user_id',
    'user_auth_devices.user_agent',
    'user_auth_devices.ip_address',
    'user_auth_devices.disabled',
    'user_auth_devices.blocked_at',
    'user_auth_devices.email',
  ];
  private readonly RETURNING_COLUMNS = 'id, user_id, user_agent, ip_address, disabled, blocked_at, email';
  constructor() {
    super('user_auth_devices');
  }

  async create(extraData: CreateUserAuthDeviceInput): Promise<UserAuthDevice> {
    const columns = Object.keys(extraData);
    const values = Object.values(extraData);
    return await this.query().insertAndGet<UserAuthDevice>(
      columns,
      values,
      this.COLUMNS,
    );
  }
  async findOneByAuthDevice(authDevice: {
    user_id?: number;
    user_agent?: string;
    ip_address?: string;
  }): Promise<UserAuthDevice> {
    return await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', authDevice.user_id)
      .where('user_agent', '=', authDevice.user_agent)
      .where('ip_address', '=', authDevice.ip_address)
      .first<UserAuthDevice>();
  }

  async updateById(
    id: number,
    updateUserAuthDeviceInput: UpdateUserAuthDeviceInput,
  ): Promise<UserAuthDevice> {
    const columns = Object.keys(updateUserAuthDeviceInput);
    const values = Object.values(updateUserAuthDeviceInput);
    await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserAuthDevice>();
    return result;
  }

  /**
   * Records the browser that proved `email` (wait-list validation) as trusted before a user
   * exists. First validation wins: an email keeps the device it first validated from, so a later
   * insert never replaces it.
   */
  async createPreValidated(device: {
    email: string;
    user_agent: string;
    ip_address: string;
  }): Promise<UserAuthDevice | null> {
    const result = await Query.raw(
      `INSERT INTO user_auth_devices (email, user_agent, ip_address, disabled, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, FALSE, NULL, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING ${this.RETURNING_COLUMNS};`,
      [device.email, device.user_agent, device.ip_address],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return rows[0] ?? null;
  }

  /**
   * Hands the pre-validated device for `email` to `user_id`, only when the registering browser is
   * the one that validated, the device isn't blocked and was validated after `validatedAfter`.
   * The `user_id IS NULL` guard makes the claim single-use even under concurrent registrations.
   */
  async claimPreValidated(device: {
    email: string;
    user_id: number;
    user_agent: string;
    ip_address: string;
    validatedAfter: Date;
  }): Promise<UserAuthDevice | null> {
    const result = await Query.raw(
      `UPDATE user_auth_devices
       SET user_id = $2, disabled = FALSE, updated_at = NOW()
       WHERE email = $1
         AND user_id IS NULL
         AND user_agent = $3
         AND ip_address = $4
         AND blocked_at IS NULL
         AND created_at > $5::timestamptz
       RETURNING ${this.RETURNING_COLUMNS};`,
      [
        device.email,
        device.user_id,
        device.user_agent,
        device.ip_address,
        device.validatedAfter.toISOString(),
      ],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return rows[0] ?? null;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
