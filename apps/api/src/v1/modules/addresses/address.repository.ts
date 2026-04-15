import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { AddressSchemaColumns } from '@repo/common-lib/schemas/address';
import {
  Address,
  CreateAddressInput,
  UpdateAddressInput,
} from '@repo/common-lib/types/address';

@Injectable()
export class AddressRepository extends BaseRepository {
  private readonly COLUMNS: AddressSchemaColumns[] = [
    'addresses.id',
    'addresses.formated_address',
    'addresses.street',
    'addresses.city',
    'addresses.state',
    'addresses.zip',
    'addresses.country',
    'addresses.country_code',
    'addresses.latitude',
    'addresses.longitude',
    'addresses.user_id',
    'addresses.client_id',
    'addresses.created_at',
    'addresses.updated_at',
  ];
  constructor(protected readonly logService: LogService) {
    super('addresses', logService, {
      softDelete: false,
    });
  }

  public async getOneById(id: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<Address>();
  }

  public async getFirstByUser(userId: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .first<Address>();
  }

  public async getFirstByClient(clientId: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('client_id', '=', clientId)
      .first<Address>();
  }

  public async create(data: CreateAddressInput) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    return await this.query().insertAndGet<Address>(
      columns,
      values,
      this.COLUMNS,
    );
  }

  public async updateAndGet(id: number, data: UpdateAddressInput) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length)
      await this.query().where('id', '=', id).update(columns, values);
    return this.query()
      .where('id', '=', id)
      .select(this.COLUMNS)
      .first<Address>();
  }
}
