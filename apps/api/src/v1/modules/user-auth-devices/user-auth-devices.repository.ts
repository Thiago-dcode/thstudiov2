import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreateUserAuthDeviceInput,
  UserAuthDeviceSchemaColumns,
  UpdateUserAuthDeviceInput,
} from '@repo/database/schemas/user-sessions';
import { UserAuthDevice } from './user-auth-devices.type';

@Injectable()
export class UserAuthDevicesRepository extends BaseRepository {
  private readonly COLUMNS: UserAuthDeviceSchemaColumns[] = [
    'user_auth_devices.id',
    'user_auth_devices.user_id',
    'user_auth_devices.user_agent',
    'user_auth_devices.ip_address',
    'user_auth_devices.disabled',
    'user_auth_devices.blocked',
  ];
  constructor() {
    super('user_auth_devices');
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(extraData: CreateUserAuthDeviceInput): Promise<UserAuthDevice> {
    const columns = Object.keys(extraData);
    const values = Object.values(extraData);
    return await this.queryBuilder.insertAndGet<UserAuthDevice>(
      columns,
      values,
      this.COLUMNS,
    );
  }
  async findOneByAuthDevice(authDevice: {
    user_id: number;
    user_agent: string;
    ip_address: string;
  }): Promise<UserAuthDevice> {
    return await this.queryBuilder
      .select(this.COLUMNS)
      .where('user_id', '=', authDevice.user_id)
      .where('user_agent', '=', authDevice.user_agent)
      .where('ip_address', '=', authDevice.ip_address)
      .first<UserAuthDevice>();
  }

  async update(
    id: number,
    updateUserAuthDeviceInput: UpdateUserAuthDeviceInput,
  ): Promise<UserAuthDevice> {
    const columns = Object.keys(updateUserAuthDeviceInput);
    const values = Object.values(updateUserAuthDeviceInput);
    await this.queryBuilder.where('id', '=', id).update(columns, values);
    const result = await this.queryBuilder
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<UserAuthDevice>();
    return result;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
