import { Injectable } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { CreateUserAuthDeviceInput, UpdateUserAuthDeviceInput } from '@repo/database/schemas/user-sessions';

@Injectable()
export class UserAuthDevicesService {
  constructor(
    private readonly userAuthDevicesRepository: UserAuthDevicesRepository,
  ) {}

  async getOneOrCreate(authDevice: CreateUserAuthDeviceInput) {
    let userDevice = await this.userAuthDevicesRepository.findOneByAuthDevice({
      user_id: authDevice.user_id,
      user_agent: authDevice.user_agent,
      ip_address: authDevice.ip_address,
    });
    if (!userDevice) {
      userDevice = await this.userAuthDevicesRepository.create(authDevice);
    }
    return userDevice;
  }

  update(id: number, updateUserAuthDeviceInput: UpdateUserAuthDeviceInput) {
    return this.userAuthDevicesRepository.update(id, updateUserAuthDeviceInput);
  }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
