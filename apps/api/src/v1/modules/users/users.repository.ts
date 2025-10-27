import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {  User } from './users.types';
import { BaseUser, BaseUserWithPassword } from '@repo/common-lib/types/user';
import {
  BaseUserSchema,
  BaseUserSchemaColumns,
  CreateUserInput,
  UpdateUserInput,
  UserSchemaWithAddress,
  UserSchemaWithAddressColumns,
} from '@repo/database/schemas/users';

@Injectable()
export class UserRepository extends BaseRepository {
  private readonly FULL_COLUMNS: UserSchemaWithAddressColumns[] = [
    // From users (main table)
    'users.id',
    'users.name',
    'users.surname',
    'users.username',
    'users.password',
    'users.biography',
    'users.email',
    'users.email_validated',
    'users.is_active',
    'users.twofa_attempts',
    'users.number_email_validations_sent',
    'users.address_id',
    'users.twofa_enabled',
    'users.twofa_code',
    'users.twofa_expires_at',
    'users.created_at',
    'users.updated_at',
    // From addresses (only colliding columns aliased)
    'addresses.id as addr_id',
    'addresses.created_at as addr_created_at',
    'addresses.updated_at as addr_updated_at',
    'addresses.street',
    'addresses.city',
    'addresses.state',
    'addresses.zip',
    'addresses.country',
    'addresses.latitude',
    'addresses.longitude',
  ];
  private readonly BASE_COLUMNS: BaseUserSchemaColumns[] = [
    'users.id',
    'users.email',
    'users.username',
    'users.email_validated',
    'users.twofa_enabled',
    'users.twofa_code',
    'users.twofa_expires_at',
    'users.is_active',
    'users.twofa_attempts',
    'users.funnel_step',
  ] as const;
  constructor() {
    super('users');
  }
  async findById(id: number): Promise<User> {
    const result = await this.queryBuilder
      .select(this.FULL_COLUMNS)
      .where('id', '=', id)
      .join('address_id', 'addresses', 'id', 'LEFT')
      .first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatFullUser(result);
  }
  async findOneBy(
    column: string,
    value: any,
    full: boolean = false,
  ): Promise<BaseUser | User> {
    let query = this.queryBuilder.where(column, '=', value);
    if (full) {
      query = query
        .join('address_id', 'addresses', 'id', 'LEFT')
        .select(this.FULL_COLUMNS);
    } else {
      query = query.select(this.BASE_COLUMNS);
    }
    const result = await query.first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return full ? this.formatFullUser(result) : this.formatUser(result);
  }
  async findOneByColumnWithPassword(
    column: string,
    value: any,
  ): Promise<BaseUserWithPassword> {
    const result = await this.queryBuilder
      .where(column, '=', value)
      .select([...this.BASE_COLUMNS, 'password'])
      .first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatUser(result, true) as BaseUserWithPassword;
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(user: CreateUserInput): Promise<BaseUser> {
    const result = await super._create<BaseUserSchema>(user, {
      select: this.BASE_COLUMNS,
    });
    return this.formatUser(result, false) as BaseUser;
  }
  async updateById(id: number, user: UpdateUserInput): Promise<BaseUser> {
    const columns = Object.keys(user);
    const values = Object.values(user);
    await this.queryBuilder.where('id', '=', id).update(columns, values);
    const result = await this.queryBuilder
      .select(this.BASE_COLUMNS)
      .where('id', '=', id)
      .first<BaseUserSchema>();
    return this.formatUser(result, false) as BaseUser;
  }
  private formatUser(
    result: BaseUserSchema,
    withPassword: boolean = false,
  ): BaseUser | BaseUserWithPassword {
    const baseUser = {
      id: result?.id,
      email: result?.email,
      username: result?.username,
      email_validated: result?.email_validated,
      twofa_enabled: result?.twofa_enabled,
      twofa_code: result?.twofa_code,
      twofa_expires_at: result?.twofa_expires_at,
      password: withPassword ? result?.password : undefined,
      funnel_step: result.funnel_step,
      is_active: result?.is_active,
      twofa_attempts: result?.twofa_attempts,
    };

    return baseUser;
  }
  private formatFullUser(result: UserSchemaWithAddress): User {
    return {
      ...this.formatUser(result),
      address: result?.addr_id
        ? {
            id: result?.addr_id,
            street: result?.street,
            city: result?.city,
            state: result?.state,
            zip: result?.zip,
            country: result?.country,
            latitude: result?.latitude,
            longitude: result?.longitude,
          }
        : null,
    };
  }
  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
