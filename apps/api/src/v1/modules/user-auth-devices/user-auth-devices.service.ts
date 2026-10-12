import { Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
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

// How long an email validation vouches for its browser. Wait-list invites go out ~2 days after
// validation and expire 2 days later; past this window registration falls back to the 2FA code.
const PRE_VALIDATED_DEVICE_TTL_DAYS = 30;

const isKnownIdentity = (device: { user_agent: string; ip_address: string }) =>
  !!device.user_agent && device.user_agent !== '-' && !!device.ip_address && device.ip_address !== '-';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

  /**
   * Trust the browser that just proved `email`, so registering from it later skips the 2FA code.
   * Returns null when the identity is unknown (a device we can't recognise again is worthless,
   * and trusting `-`/`-` would match every client without headers) or the email already has one.
   */
  async createPreValidated(device: { email: string; user_agent: string; ip_address: string }) {
    if (!isKnownIdentity(device)) return null;
    return this.userAuthDevicesRepository.createPreValidated(
      clipUserAgent({ ...device, email: normalizeEmail(device.email) }),
    );
  }

  /** Claims the pre-validated device for a just-registered user; null means 2FA is still needed. */
  async claimPreValidated(device: {
    email: string;
    user_id: number;
    user_agent: string;
    ip_address: string;
  }) {
    if (!isKnownIdentity(device)) return null;
    return this.userAuthDevicesRepository.claimPreValidated(
      clipUserAgent({
        ...device,
        email: normalizeEmail(device.email),
        validatedAfter: subDays(new Date(), PRE_VALIDATED_DEVICE_TTL_DAYS),
      }),
    );
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
