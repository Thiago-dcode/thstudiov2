import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UPDATE_PROFILE_STATUS_EVENT } from '@repo/common-lib/constants/events';
import { QueueHelper } from '@repo/backend-lib/utils';
import type { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';
import { Query } from '@repo/database/facades';
import type { ClientSchema } from '@repo/common-lib/schemas/client';
import { AddressRepository } from './address.repository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '@repo/common-lib/types/address';
import { cleanObj } from '@repo/common-lib/utils/object';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { RequestService } from 'src/common/services/request.service';
import { UpdateProfileStatusEvent } from '../profile-status/events/update-profile-status.event';

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

  /**
   * `addresses.user_id` / `addresses.client_id` are unique (one address per owner), and callers
   * cannot always know whether a row already exists — the address editor is reachable from the
   * onboarding funnel and the profile page, each rendering its own snapshot of the current address.
   * So creating is an upsert: an existing row for the owner is patched instead of rejected.
   */
  public async create(data: CreateAddressInput) {
    if (!data.user_id && !data.client_id) {
      throw new BadRequestException('User id or client id must be sent');
    }
    if (data.client_id) {
      await this.assertOwnsClient(data.client_id);
    }
    cleanObj(data);

    const existing = data.user_id
      ? await this.addressRepository.getFirstByUser(data.user_id)
      : await this.addressRepository.getFirstByClient(data.client_id!);

    if (existing) {
      const patch: UpdateAddressInput = { ...data };
      delete patch.user_id;
      delete patch.client_id;
      return await this.update(existing.id, patch);
    }

    const result = await this.addressRepository.create(data);
    await this.enqueueCreateOrUpdateLocationFromAddress(result);
    this.emitProfileStatusFromAddress(result);
    await this.markUserSeoStale(result.user_id);
    return result;
  }

  public async update(id: number, data: UpdateAddressInput) {

    const address = await this.addressRepository.getOneById(id);

    if (address.user_id) {
      if (address.user_id !== this.requestService.user.id) {
        throw new UnauthorizedException();
      }
    } else if (address.client_id) {
      await this.assertOwnsClient(address.client_id);
    }

    if (!Object.values(data).length) {
      return address;
    }

    const patch = this.applyLocationHierarchyConsistency(data);

    const result = await this.addressRepository.updateAndGet(id, patch);
    if (result) {
      await this.enqueueCreateOrUpdateLocationFromAddress(result);
      this.emitProfileStatusFromAddress(result);
      if (this.localityChanged(address, result)) {
        await this.markUserSeoStale(result.user_id);
      }
    }
    return result;
  }

  private async assertOwnsClient(clientId: number): Promise<void> {
    const client = await Query.table('clients')
      .select(['user_id'])
      .where('id', '=', clientId)
      .first<Pick<ClientSchema, 'user_id'>>();
    if (!client || client.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }
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

  private localityChanged(before: Address, after: Address): boolean {
    return (['city', 'state', 'country'] as const).some(
      (key) => (before[key] ?? '').trim() !== (after[key] ?? '').trim(),
    );
  }

  /**
   * The artist's AI title/description are written from their city ("… — Madrid — …"), but the
   * address lives in its own table, so moving an artist never touched `users.updated_at` and the
   * profile kept advertising the old city indefinitely — a name/place contradiction on the page's
   * own JSON-LD. Backdating the stamp (rather than clearing it) hands the rewrite to the nightly
   * `findDueForSeoGeneration` sweep and keeps its regeneration throttle; a never-generated row stays
   * NULL and is picked up anyway. Same pattern as `markSeoStaleByMediaId`.
   */
  private async markUserSeoStale(userId?: number | null): Promise<void> {
    if (!userId) return;
    await Query.raw(
      `UPDATE ${TABLES_ENUM.USERS}
       SET seo_generated_at = seo_generated_at - INTERVAL '1 second'
       WHERE id = $1`,
      [userId],
    );
  }

  private emitProfileStatusFromAddress(result: Address): void {
    if (!result.user_id) return;
    const hasLocation = Boolean(
      result.country?.trim() ||
        result.city?.trim() ||
        result.formated_address?.trim(),
    );
    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(result.user_id, {
        has_location: hasLocation,
      }),
    );
  }

  private async enqueueCreateOrUpdateLocationFromAddress(result: Address): Promise<void> {
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
    await QueueHelper.createOrUpdateLocationJob(payload);
  }
}
