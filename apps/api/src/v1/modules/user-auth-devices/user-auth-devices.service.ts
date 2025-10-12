import { Injectable } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import {
  CreateUserAuthDeviceInput,
  UpdateUserAuthDeviceInput,
} from '@repo/database/schemas/user-sessions';

@Injectable()
export class UserAuthDevicesService {
  constructor(
    private readonly userAuthDevicesRepository: UserAuthDevicesRepository,
  ) {}
  async getOneByAuthDevice(authDevice: {
    user_id: number;
    user_agent: string;
    ip_address: string;
  }) {
    return await this.userAuthDevicesRepository.findOneByAuthDevice(authDevice);
  }
  async getOneOrCreate(authDevice: CreateUserAuthDeviceInput) {
    let userDevice = await this.getOneByAuthDevice(authDevice);
    if (!userDevice) {
      userDevice = await this.userAuthDevicesRepository.create(authDevice);
    }
    return userDevice;
  }

  update(id: number, updateUserAuthDeviceInput: UpdateUserAuthDeviceInput) {
    return this.userAuthDevicesRepository.updateById(id, updateUserAuthDeviceInput);
  }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
