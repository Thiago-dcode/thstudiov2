import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AddressRepository } from './address.repository';
import {
  CreateAddressInput,
  UpdateAddressInput,
} from '@repo/common-lib/types/address';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class AddressService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly requestService: RequestService,
  ) { }

  public async findOneById(id: number) {
    return await this.addressRepository.getOneById(id);
  }

  public async findOneByUser(userId: number) {
    return await this.addressRepository.getFirstByUser(userId);
  }

  public async findOneByClient(clientId: number) {
    return await this.addressRepository.getFirstByClient(clientId);
  }

  public async create(data: CreateAddressInput) {
    if (!data.user_id && !data.client_id) {
      throw new BadRequestException('User id or client id must be sent');
    }
    cleanObj(data);
    const result = await this.addressRepository.create(data);
    return result;
  }

  public async update(id: number, data: UpdateAddressInput) {

    const address = await this.addressRepository.getOneById(id);

    // Check authorization - user can only update their own address or client address
    if (address.user_id && address.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }
    // If it's a client address, you might want to add additional checks here

    if (!Object.values(data).length) {
      return address;
    }

    return await this.addressRepository.updateAndGet(id, data);
  }
}
