import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CompactUser,
  CreateUserInput,
  UpdateUserInput,
  User,
} from '@repo/common-lib/types/user';
import { BaseUser, BaseUserWithSecrets } from '@repo/common-lib/types/user';
import {
  BaseUserSchema,
  BaseUserSchemaColumns,
  UserSchema,
  UserSchemaColumns,
} from '@repo/common-lib/schemas/user';
import { EnumType } from '@repo/common-lib/constants/enums';

@Injectable()
export class UserRepository extends BaseRepository {
  private readonly BASE_COLUMNS: BaseUserSchemaColumns[] = [
    'users.id',
    'users.public_id',
    'users.email',
    'users.username',
    'users.profession',
    'users.stripe_customer_id',
    'users.email_validated',
    'users.twofa_enabled',
    'users.twofa_expires_at',
    'users.is_active',
    'users.banned',
    'users.banned_reason',
    'users.funnel_step',
  ] as const;
  private readonly COMPACT_COLUMNS: string[] = [
    'users.id',
    'users.email',
    'users.username',
  ] as const;
  private readonly FULL_COLUMNS: UserSchemaColumns[] = [
    ...this.BASE_COLUMNS,
    'users.avatar',
    'users.banner',
    'users.name',
    'users.surname',
    'users.short_biography',
    'users.biography',
  ];

  constructor() {
    super('users');
  }
  async findByIdCompact(id: number): Promise<CompactUser> {
    const result = await this.query()
      .select(this.COMPACT_COLUMNS)
      .where('id', '=', id)
      .first<CompactUser>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return result;
  }

  async findById(id: number): Promise<User> {
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .where('id', '=', id)
      .first<UserSchema>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatFullUser(result);
  }
  async getPublicId(id: number) {

    return await this.query().select(['public_id']).where('id', '=', id).where('banned', '=', false).first<{
      public_id: string,
    } | null>();
  }
  async findOneBy(
    column: keyof UserSchema,
    value: any,
    format: EnumType<'FORMAT_TYPE'> = 'COMPACT',
  ): Promise<BaseUser | User> {
    let query = this.query().where(column, '=', value);
    if (format === 'FULL') {
      query = query.select(this.FULL_COLUMNS);
    } else {
      query = query.select(this.BASE_COLUMNS);
    }
    const result = await query.first<UserSchema>();
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

  async findOneByColumnWithSecrets(
    column: string,
    value: any,
  ): Promise<BaseUserWithSecrets> {
    const cols = [...this.BASE_COLUMNS, 'password', 'twofa_code'];
    const result = await this.query()
      .where(column, '=', value)
      .select(cols)
      .first<BaseUserSchema>();
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
    if (columns.length && values.length) await this.query().where('id', '=', id).update(columns, values);
    const result = await this.query()
      .select(this.BASE_COLUMNS)
      .where('id', '=', id)
      .first<BaseUserSchema>();
    return this.formatUser(result, false) as BaseUser;
  }
  private formatUser(
    result: BaseUserSchema,
    withSecrets: boolean = false,
  ): BaseUser | BaseUserWithSecrets {
    return {
      id: result?.id,
      public_id: result.public_id,
      email: result?.email,
      username: result?.username,
      profession: result?.profession,
      email_validated: result?.email_validated,
      stripe_customer_id: result.stripe_customer_id,
      password: withSecrets ? result?.password : undefined,
      twofa_code: withSecrets ? result.twofa_code : undefined,
      twofa_enabled: result.twofa_enabled,
      twofa_expires_at: result.twofa_expires_at,
      funnel_step: result.funnel_step,
      is_active: result?.is_active,
      banned: result?.banned,
      banned_reason: result?.banned_reason,
    };
  }
  private formatFullUser(result: UserSchema): User {
    return {
      ...this.formatUser(result),
      avatar: result?.avatar,
      banner: result?.banner,
      name: result?.name,
      surname: result?.surname,
      short_biography: result?.short_biography,
      biography: result?.biography,
    };
  }
  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
