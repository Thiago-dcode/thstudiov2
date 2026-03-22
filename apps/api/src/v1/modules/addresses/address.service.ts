import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CREATE_OR_UPDATE_LOCATION } from '@repo/common-lib/constants/constants';
import type { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';
import { AddressRepository } from './address.repository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '@repo/common-lib/types/address';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { RequestService } from 'src/common/services/request.service';
import { CreateOrUpdateLocationEvent } from '../locations/events/create-or-update-location.event';

@Injectable()
export class AddressService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly requestService: RequestService,
    private readonly eventEmitter: EventEmitter2,
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
    this.emitCreateOrUpdateLocationFromAddress(result);
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

    const patch = this.applyLocationHierarchyConsistency(data);

    const result = await this.addressRepository.updateAndGet(id, patch);
    if (result) {
      this.emitCreateOrUpdateLocationFromAddress(result);
    }
    return result;
  }

  /** When `country` is in the patch: omitted `state` / `city` → null. */
  private applyLocationHierarchyConsistency(
    data: UpdateAddressInput,
  ): UpdateAddressInput {
    const patch: UpdateAddressInput = { ...data };

    if ('country' in data) {
      if (!('state' in data)) {
        patch.state = null;
      }
      if (!('city' in data)) {
        patch.city = null;
      }
    }

    return patch;
  }

  private emitCreateOrUpdateLocationFromAddress(result: Address): void {
    const country = result.country?.trim() ?? '';
    const country_code = result.country_code?.trim() ?? '';
    if (!country || !country_code) {
      return;
    }
    const payload: CreateOrUpdateLocationPayload = {
      country,
      country_code,
    };
    const state = result.state?.trim();
    const city = result.city?.trim();
    if (state) payload.state = state;
    if (city) payload.city = city;
    this.eventEmitter.emit(
      CREATE_OR_UPDATE_LOCATION,
      new CreateOrUpdateLocationEvent(payload),
    );
  }
}
