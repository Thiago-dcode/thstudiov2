import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CompactUser,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfile,
} from '@repo/common-lib/types/user';
import { BaseUser, BaseUserWithSecrets } from '@repo/common-lib/types/user';
import {
  BaseUserSchema,
  BaseUserSchemaColumns,
  UserSchema,
  UserSchemaColumns,
  UserProfileSchema,
  UserProfileSchemaColumns,
} from '@repo/common-lib/schemas/user';
import { EnumType } from '@repo/common-lib/constants/enums';
import { CategoryBase } from '@repo/common-lib/types/category';
import { ProfileAddress } from '@repo/common-lib/types/user';

@Injectable()
export class UserRepository extends BaseRepository {
  private readonly BASE_COLUMNS :BaseUserSchemaColumns[]= [
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
    'users.username_reset_count',
    'users.password_reset_count',
    'users.next_username_reset',
    'users.next_password_reset',
  ];

  private readonly COMPACT_COLUMNS = [
    'users.id',
    'users.email',
    'users.username',
    'users.name',
    'users.surname'
  ] as const;

  private readonly FULL_COLUMNS:UserSchemaColumns[] = [
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
      .select([...this.COMPACT_COLUMNS])
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
  async findByUsernameCompact(username: string): Promise<CompactUser> {
    const result = await this.query()
      .select([...this.COMPACT_COLUMNS])
      .where('username', '=', username)
      .first<CompactUser>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + username,
        HttpStatus.NOT_FOUND,
      );
    }
    return result;
  }

  async usernameExists(username: string): Promise<boolean> {

    return await this.query().where('username', '=', username).exists();

  }

  async findById(id: number): Promise<User> {
    const result = await this.query()
      .select([...this.FULL_COLUMNS])
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

  private readonly PROFILE_COLUMNS:UserProfileSchemaColumns[] = [
   'users.id',
   'users.name',
   'users.surname',
   'users.username',
   'users.email',
   'users.avatar',
   'users.banner',
   'users.banned',
   'users.banned_reason',
   'users.is_active',
   'users.short_biography',
   'users.biography',

    // Address — minimal
    'addresses.id as a_id',
    'addresses.formated_address',
    'addresses.street',
    'addresses.city',
    'addresses.state',

    // Pivot user_categories
    'user_categories.id as uc_id',
    'user_categories.user_id as uc_user_id',
    'user_categories.category_id',

    // Categories
    'categories.id as c_id',
    'categories.tags',
    'categories.name as c_name',
    'categories.parent_id',
  ];

  async getUserProfile(username: string): Promise<UserProfile | null> {
    const result = await this.query()
      .select(this.PROFILE_COLUMNS)
      .where('users.username', '=', username)
      .join('id', 'addresses', 'user_id', 'LEFT')
      .join('id', 'user_categories', 'user_id', 'LEFT')
      .join('user_categories.category_id', 'categories', 'id', 'LEFT')
      .get<UserProfileSchema[]>();

    if (!result || result.length === 0) return null;

    return this.formatUserProfile(result);
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
    if (!result) return null;
    return this.formatUser(result, true) as BaseUserWithSecrets;
  }

  async create(user: CreateUserInput): Promise<BaseUser> {
    const result = await super._create<BaseUserSchema>(user, {
      select:this.BASE_COLUMNS,
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
      username_reset_count: result.username_reset_count,
      password_reset_count: result.password_reset_count,
      next_username_reset: result.next_username_reset ?? undefined,
      next_password_reset: result.next_password_reset ?? undefined,
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

  private formatUserProfile(rows: UserProfileSchema[]): UserProfile {
    const first = rows[0];

    const address: ProfileAddress | null = first.a_id != null
      ? {
        formated_address: first.formated_address ?? null,
        street: first.street ?? null,
        city: first.city ?? null,
        state: first.state ?? null,
      }
      : null;

    const categoriesMap = new Map<number, CategoryBase>();

    for (const row of rows) {
      if (!row.c_id) continue;
      if (categoriesMap.has(row.c_id)) continue;

      categoriesMap.set(row.c_id, {
        id: row.c_id,
        name: row.c_name ?? '',
        parent_id: row.parent_id ?? null,
        thumbnail: null,
        tags: row.tags ? row.tags.split(',') : [],
      });
    }

    return {
      id: first.id,
      name: first.name,
      surname: first.surname,
      username: first.username,
      email: first.email,
      avatar: first.avatar,
      banner: first.banner,
      banned: first.banned,
      banned_reason: first.banned_reason,
      is_active: first.is_active,
      short_biography: first.short_biography,
      biography: first.biography,
      address,
      categories: Array.from(categoriesMap.values()),
    };
  }
  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
