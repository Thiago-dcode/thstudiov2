import { Injectable } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { CreateUserAuthDeviceInput } from '@repo/database/schemas/user-sessions';

@Injectable()
export class UserAuthDevicesService {
  constructor(
    private readonly userAuthDevicesRepository: UserAuthDevicesRepository,
  ) {}

  async getOneOrCreate({
    user_agent,
    ip_address,
    user_id,
    disabled,
    blocked,
  }: CreateUserAuthDeviceInput) {
    let userDevice = await this.userAuthDevicesRepository.findOneByAuthDevice({
      user_id,
      user_agent,
      ip_address,
    });
    if (!userDevice) {
      userDevice = await this.userAuthDevicesRepository.create({
        user_id,
        user_agent,
        ip_address,
        disabled: disabled,
        blocked: blocked,
      });
    }
    return userDevice;
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
