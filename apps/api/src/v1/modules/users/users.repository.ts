import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CompactUser,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfile,
  ArtistIndexRequest,
  ArtistCard,
  BaseUser,
  BaseUserWithSecrets,
  ProfileAddress,
} from '@repo/common-lib/types/user';
import {
  UserCoreRoleRow,
  UserCoreSelectColumn,
  UserSchema,
  UserProfileRow,
  UserProfileSelectColumn,
  UserFullSelectColumn,
  UserFullBenefitRow,
  UserFullBenefitSelectColumn,
  ArtistSearchRow,
  ArtistSearchSelectColumn,
} from '@repo/common-lib/schemas/user';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Join } from '@repo/common-lib/types/database';
import { CategoryBase } from '@repo/common-lib/types/category';
import { RequestService } from 'src/common/services/request.service';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { foldLatinDiacriticsForMatch } from '@repo/common-lib/utils/fold-latin-diacritics';

@Injectable()
export class UserRepository extends BaseRepository {
  private static readonly USER_ROLE_JOIN: Join[] = [
    {
      type: 'INNER',
      localColumn: 'role_id',
      foreignTable: TABLES_ENUM.ROLES,
      foreignColumn: 'id',
    },
  ];

  private readonly CORE_COLUMNS: UserCoreSelectColumn[] = [
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
    'users.is_featured',
    'users.funnel_step',
    'users.username_reset_count',
    'users.password_reset_count',
    'users.next_username_reset',
    'users.next_password_reset',
    'users.role_id',
    'roles.id as r_id',
    'roles.name as r_name',
  ];

  private readonly COMPACT_COLUMNS = [
    'users.id',
    'users.email',
    'users.username',
    'users.name',
    'users.surname',
    'users.benefit_id'
  ] as const;

  private readonly FULL_COLUMNS: UserFullSelectColumn[] = [
    ...this.CORE_COLUMNS,
    'users.avatar',
    'users.banner',
    'users.name',
    'users.surname',
    'users.short_biography',
    'users.biography',
  ];

  private readonly BENEFIT_COLUMNS: UserFullBenefitSelectColumn[] = [
    'benefits.id as b_id',
    'benefits.name as b_name',
    'benefits.type',
    'benefits.trial_days',
    'benefits.stripe_coupon_id',
    'benefits.active',
    'user_benefits.id as ub_id',
    'user_benefits.redeemed',
  ];

  private readonly ARTIST_SEARCH_COLUMNS: ArtistSearchSelectColumn[] = [
    'users.id',
    'users.username',
    'users.name',
    'users.surname',
    'users.avatar',
    'users.profession',
    'users.short_biography',
    'users.is_featured',
    'addresses.id as a_id',
    'addresses.city',
    'addresses.state',
    'addresses.country',
  ];

  constructor(private readonly requestService: RequestService) {
    super('users');
  }

  private joinUserRole(q: QueryBuilder): QueryBuilder {
    return q.join('role_id', TABLES_ENUM.ROLES, 'id', 'INNER');
  }

  private joinBenefit(q: QueryBuilder): QueryBuilder {
    return q
      .join('benefit_id', TABLES_ENUM.BENEFITS, 'id', 'LEFT')
      .join('id', TABLES_ENUM.USER_BENEFITS, 'user_id', 'LEFT', `AND user_benefits.benefit_id = users.benefit_id`);
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
    const query = this.joinUserRole(this.query());
    this.joinBenefit(query);
    const result = await query
      .select([...this.FULL_COLUMNS, ...this.BENEFIT_COLUMNS])
      .where('id', '=', id)
      .first<UserFullBenefitRow>();
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
  ): Promise<BaseUser> {
    const result = await this.joinUserRole(this.query())
      .where(column, '=', value)
      .select(this.CORE_COLUMNS)
      .first<UserCoreRoleRow>();
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatCoreUser(result);
  }

  private readonly PROFILE_COLUMNS: UserProfileSelectColumn[] = [
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
    'users.profession',
    'users.is_featured',

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
    'category_translations.name as c_tr_name',
    'categories.slug as c_slug' as UserProfileSelectColumn,
    'categories.parent_id',
  ];

  async getUserProfile(username: string): Promise<UserProfile | null> {
    const result = await this.query()
      .select(this.PROFILE_COLUMNS)
      .where('users.username', '=', username)
      .join('id', 'addresses', 'user_id', 'LEFT')
      .join('id', 'user_categories', 'user_id', 'LEFT')
      .join('user_categories.category_id', 'categories', 'id', 'LEFT')
      .join(
        'categories.id',
        TABLES_ENUM.CATEGORY_TRANSLATIONS,
        'category_id',
        'LEFT',
        `AND category_translations.language_code = '${this.requestService.language}'`,
      )
      .get<UserProfileRow[]>();

    if (!result || result.length === 0) return null;

    return this.formatUserProfile(result);
  }

  async findOneByWithSecrets(
    column: string,
    value: any,
  ): Promise<BaseUserWithSecrets> {
    const cols = [...this.CORE_COLUMNS, 'users.password', 'users.twofa_code'];
    const result = await this.joinUserRole(this.query())
      .where(column, '=', value)
      .select(cols)
      .first<UserCoreRoleRow & { password: string; twofa_code?: string }>();
    if (!result) return null;
    const core = this.formatCoreUser(result);
    return { ...core, password: result.password, twofa_code: result.twofa_code };
  }

  async create(user: CreateUserInput): Promise<BaseUser> {
    const result = await super._create<UserCoreRoleRow>(user, {
      select: this.CORE_COLUMNS,
      join: UserRepository.USER_ROLE_JOIN,
    });
    return this.formatCoreUser(result);
  }

  async updateById(id: number, user: UpdateUserInput): Promise<BaseUser> {
    const columns = Object.keys(user);
    const values = Object.values(user);
    if (columns.length && values.length) await this.query().where('id', '=', id).update(columns, values);
    const result = await this.joinUserRole(this.query())
      .select(this.CORE_COLUMNS)
      .where('id', '=', id)
      .first<UserCoreRoleRow>();
    return this.formatCoreUser(result);
  }
  private formatCoreUser(result: UserCoreRoleRow): BaseUser {
    return {
      id: result.id,
      public_id: result.public_id,
      email: result.email,
      username: result.username,
      role: { id: result.r_id, name: result.r_name },
      profession: result.profession,
      email_validated: result.email_validated,
      stripe_customer_id: result.stripe_customer_id,
      twofa_enabled: result.twofa_enabled,
      twofa_expires_at: result.twofa_expires_at,
      username_reset_count: result.username_reset_count,
      password_reset_count: result.password_reset_count,
      next_username_reset: result.next_username_reset ?? undefined,
      next_password_reset: result.next_password_reset ?? undefined,
      funnel_step: result.funnel_step,
      is_active: result.is_active,
      banned: result.banned,
      banned_reason: result.banned_reason,
      is_featured: result.is_featured,
      benefit_id: result.benefit_id,
      invitation_link_id: result.invitation_link_id,
    };
  }
  private formatFullUser(result: UserFullBenefitRow): User {
    return {
      ...this.formatCoreUser(result),
      avatar: result?.avatar,
      banner: result?.banner,
      name: result?.name,
      surname: result?.surname,
      short_biography: result?.short_biography,
      biography: result?.biography,
      benefit: result.b_id != null
        ? {
          id: result.b_id,
          type: result.type!,
          name: result.b_name!,
          trial_days: result.trial_days!,
          stripe_coupon_id: result.stripe_coupon_id ?? null,
          active: result.active!,
          redeemed: result.redeemed ?? false,
        }
        : null,
    };
  }

  private formatUserProfile(rows: UserProfileRow[]): UserProfile {
    const first = rows[0];

    const address: ProfileAddress | null = first.a_id != null
      ? {
        formated_address: first.formated_address ?? null,
        street: first.street ?? null,
        city: first.city ?? null,
        state: first.state ?? null,
      }
      : null;

    const categoriesMap = new Map<number, Omit<CategoryBase, 'is_featured'>>();

    for (const row of rows) {
      if (!row.c_id || categoriesMap.has(row.c_id)) continue;
      categoriesMap.set(row.c_id, {
        id: row.c_id,
        name: (row.c_tr_name ?? row.c_name) ?? '',
        slug: row.c_slug ?? '',
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
      profession: first.profession ?? null,
      is_featured: first.is_featured,
      address,
      categories: Array.from(categoriesMap.values()),
    };
  }
  async findAllArtists(filters: ArtistIndexRequest): Promise<ArtistCard[]> {
    const query = this.query()
      .select(this.ARTIST_SEARCH_COLUMNS)
      .where('users.banned', '=', false)
      .where('users.is_active', '=', true)
      .join('id', 'addresses', 'user_id', 'LEFT');

    await this.applyArtistFilters(filters, query);

    const rows = await query.get<ArtistSearchRow[]>();
    if (!rows.length) return [];

    const userIds = rows.map((r) => r.id);
    const categoriesMap = await this.fetchCategoriesForUsers(userIds);

    return this.formatArtistCards(rows, categoriesMap);
  }

  private async applyArtistFilters(
    filters: ArtistIndexRequest,
    query: QueryBuilder,
  ): Promise<void> {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      query.whereGroup([
        ['users.username', 'ILIKE', `%${search}%`, 'where'],
        ['users.name', 'ILIKE', `%${search}%`, 'orWhere'],
        ['users.surname', 'ILIKE', `%${search}%`, 'orWhere'],
      ]);
    }
    if (filters.is_featured) {
      query.where('users.is_featured', '=', true);
    }

    if (filters.categories?.length) {
      const pivotRows = await this.query()
        .rawSelect('DISTINCT user_categories.user_id')
        .join('id', 'user_categories', 'user_id', 'INNER')
        .join('user_categories.category_id', 'categories', 'id', 'INNER')
        .whereIn('categories.slug', filters.categories)
        .get<{ user_id: number }[]>();

      const userIds = pivotRows.map((r) => r.user_id);
      if (userIds.length) {
        query.whereIn('users.id', userIds);
      } else {
        query.where('users.id', '=', -1);
      }
    }

    const cityFilter = filters.city?.trim();
    if (cityFilter) {
      query.where(
        'unaccent(addresses.city)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(cityFilter)}%`,
      );
    }

    const stateFilter = filters.state?.trim();
    if (stateFilter) {
      query.where(
        'unaccent(addresses.state)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(stateFilter)}%`,
      );
    }

    const countryFilter = filters.country?.trim();
    if (countryFilter) {
      query.where(
        'unaccent(addresses.country)',
        'ILIKE',
        `%${foldLatinDiacriticsForMatch(countryFilter)}%`,
      );
    }

    if (filters.lat != null && filters.lng != null) {
      const radius = filters.radius_km ?? 50;
      query
        .withinRadius('addresses.latitude', 'addresses.longitude', filters.lat, filters.lng, radius)
        .orderByDistance('addresses.latitude', 'addresses.longitude', filters.lat, filters.lng, 'ASC');
    }

    this.requestService.pagination = await this.handleOffsetPagination(query, {
      ...filters,
      paginated: true,
    });
  }

  private async fetchCategoriesForUsers(
    userIds: number[],
  ): Promise<Map<number, Pick<CategoryBase, 'id' | 'name' | 'slug'>[]>> {
    const lang = this.requestService.language;
    const rows = await this.query()
      .rawSelect(
        `user_categories.user_id, categories.id, COALESCE(category_translations.name, categories.name) AS name, categories.slug`,
      )
      .join('id', 'user_categories', 'user_id', 'INNER')
      .join('user_categories.category_id', 'categories', 'id', 'INNER')
      .join(
        'categories.id',
        TABLES_ENUM.CATEGORY_TRANSLATIONS,
        'category_id',
        'LEFT',
        `AND category_translations.language_code = '${lang}'`,
      )
      .whereIn('user_categories.user_id', userIds)
      .get<{ user_id: number; id: number; name: string; slug: string }[]>();

    const map = new Map<number, Pick<CategoryBase, 'id' | 'name' | 'slug'>[]>();
    for (const row of rows) {
      if (!map.has(row.user_id)) map.set(row.user_id, []);
      const cats = map.get(row.user_id)!;
      if (!cats.some((c) => c.id === row.id)) {
        cats.push({ id: row.id, name: row.name, slug: row.slug });
      }
    }
    return map;
  }

  private formatArtistCards(
    rows: ArtistSearchRow[],
    categoriesMap: Map<number, Pick<CategoryBase, 'id' | 'name' | 'slug'>[]>,
  ): ArtistCard[] {
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name ?? null,
      surname: row.surname ?? null,
      avatar: row.avatar,
      profession: row.profession ?? null,
      short_biography: row.short_biography ?? null,
      address: row.a_id != null
        ? {
          city: row.city ?? null,
          state: row.state ?? null,
          country: row.country ?? null,
        }
        : null,
      categories: categoriesMap.get(row.id) ?? [],
      is_featured: row.is_featured,
    }));
  }
}
