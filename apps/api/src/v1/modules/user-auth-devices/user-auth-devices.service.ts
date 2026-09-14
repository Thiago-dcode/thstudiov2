import { Injectable } from '@nestjs/common';
import { USER_AGENT_MAX_LENGTH } from '@repo/common-lib/constants/headers';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { CreateUserAuthDeviceInput, UpdateUserAuthDeviceInput } from '@repo/common-lib/types/user-session';

const clipUserAgent = <T extends { user_agent?: string }>(device: T): T => {
  if (typeof device.user_agent !== 'string') return device;
  return {
    ...device,
    user_agent: device.user_agent.slice(0, USER_AGENT_MAX_LENGTH),
  };
};

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
    return await this.userAuthDevicesRepository.findOneByAuthDevice(
      clipUserAgent(authDevice),
    );
  }
  async getOneOrCreate(authDevice: CreateUserAuthDeviceInput) {
    const clipped = clipUserAgent(authDevice);
    let userDevice = await this.getOneByAuthDevice(clipped);
    if (!userDevice) {
      userDevice = await this.userAuthDevicesRepository.create(clipped);
    }
    return userDevice;
  }

  update(id: number, updateUserAuthDeviceInput: UpdateUserAuthDeviceInput) {
    return this.userAuthDevicesRepository.updateById(
      id,
      clipUserAgent(updateUserAuthDeviceInput),
    );
  }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
