import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreateUserInput,
  UpdateUserInput,
  User,
} from '@repo/common-lib/types/user';
import { BaseUser, BaseUserWithSecrets } from '@repo/common-lib/types/user';
import {
  BaseUserSchema,
  BaseUserSchemaColumns,
  UserSchema,
  UserSchemaWithAddress,
  UserSchemaWithAddressColumns,
} from '@repo/common-lib/schemas/user';
import { EnumType } from '@repo/common-lib/constants/enums';

@Injectable()
export class UserRepository extends BaseRepository {
  private readonly BASE_COLUMNS: BaseUserSchemaColumns[] = [
    'users.id',
    'users.email',
    'users.username',
    'users.profession',
    'users.stripe_customer_id',
    'users.email_validated',
    'users.twofa_enabled',
    'users.twofa_expires_at',
    'users.is_active',
    'users.twofa_attempts',
    'users.funnel_step',
  ] as const;
  private readonly FULL_COLUMNS: UserSchemaWithAddressColumns[] = [
    // From users (main table)
    ...this.BASE_COLUMNS,
    'users.avatar',
    'users.banner',
    'users.name',
    'users.surname',
    'users.short_biography',
    'users.biography',
    // From addresses (only colliding columns aliased)
    'addresses.id as addr_id',
    'addresses.street',
    'addresses.city',
    'addresses.state',
    'addresses.zip',
    'addresses.country',
    'addresses.latitude',
    'addresses.longitude',
  ];

  constructor() {
    super('users');
  }
  async findById(id: number): Promise<User> {
    console.log(this.FULL_COLUMNS);
    const result = await this.query()
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
    console.log(result);
    return this.formatFullUser(result);
  }
  async findOneBy(
    column: keyof UserSchema,
    value: any,
    format: EnumType<'FORMAT_TYPE'> = 'COMPACT',
  ): Promise<BaseUser | User> {
    let query = this.query().where(column, '=', value);
    if (format === 'FULL') {
      query = query
        .join('address_id', 'addresses', 'id', 'LEFT')
        .select(this.FULL_COLUMNS);
    } else {
      query = query.select(this.BASE_COLUMNS);
    }
    const result = await query.first<UserSchemaWithAddress>();
    console.log('USER RESULT',result);
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return format === 'FULL'
      ? this.formatFullUser(result)
      : this.formatUser(result);
  }

  async findOneByColumnWithPassword(
    column: string,
    value: any,
  ): Promise<BaseUserWithSecrets> {
    const cols = [...this.BASE_COLUMNS, 'password', 'twofa_code'];
    const result = await this.query()
      .where(column, '=', value)
      .select(cols)
      .first<UserSchemaWithAddress>();
    if (!result) null;
    return this.formatUser(result, true) as BaseUserWithSecrets;
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
   if(columns.length && values.length) await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.BASE_COLUMNS)
      .where('id', '=', id)
      .first<BaseUserSchema>();
    return this.formatUser(result, false) as BaseUser;
  }
  private formatUser(
    result: BaseUserSchema,
    withPassword: boolean = false,
  ): BaseUser | BaseUserWithSecrets {
    return {
      id: result?.id,
      email: result?.email,
      username: result?.username,
      profession:result?.profession,
      email_validated: result?.email_validated,
      stripe_customer_id: result.stripe_customer_id,
      twofa_enabled: result?.twofa_enabled,
      twofa_code: result?.twofa_code,
      twofa_expires_at: result?.twofa_expires_at,
      password: withPassword ? result?.password : undefined,
      funnel_step: result.funnel_step,
      is_active: result?.is_active,
      twofa_attempts: result?.twofa_attempts,
    };
  }
  private formatFullUser(result: UserSchemaWithAddress): User {
    return {
      ...this.formatUser(result),
      avatar: result?.avatar,
      banner:result?.banner,
      name: result?.name,
      surname: result?.surname,
      short_biography: result?.short_biography,
      biography: result?.biography,
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
