import { LogService } from '@repo/backend-lib/services/log-service';
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
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { SEO_REGENERATION_MIN_INTERVAL_DAYS } from '@repo/common-lib/constants/cache';
import { Join } from '@repo/common-lib/types/database';
import { CategoryBase } from '@repo/common-lib/types/category';
import { EntitySeoFields, SeoTranslation } from '@repo/common-lib/types/ai';
import { RequestService } from 'src/common/services/request.service';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { Query } from '@repo/database/facades';
import { foldLatinDiacriticsForMatch } from '@repo/common-lib/utils/fold-latin-diacritics';
import { isArtistShareReady } from '@repo/common-lib/utils/artist-share-ready';

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
    'users.language',
    'roles.id as r_id',
    'roles.name as r_name',
  ];

  private readonly COMPACT_COLUMNS = [
    'users.id',
    'users.email',
    'users.username',
    'users.name',
    'users.surname',
    'users.benefit_id',
    'users.language'
  ] as const;

  private readonly FULL_COLUMNS: UserFullSelectColumn[] = [
    ...this.CORE_COLUMNS,
    'users.avatar',
    'users.banner',
    'users.name',
    'users.surname',
    'users.short_biography',
    'users.biography',
    'users.phone_number',
    'users.facebook_link',
    'users.website_link',
    'users.instagram_link',
    'users.youtube_link',
    'users.seo_title',
    'users.seo_description',
    'users.seo_generated_at',
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

  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('users', logService);
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
    'users.avatar',
    'users.banner',
    'users.is_active',
    'users.short_biography',
    'users.biography',
    'users.profession',
    'users.is_featured',
    'users.phone_number',
    'users.facebook_link',
    'users.website_link',
    'users.instagram_link',
    'users.youtube_link',
    'users.seo_title',
    'users.seo_description',
    'users.seo_generated_at',

    // SEO for the request language (main-row values are the EN fallback)
    'user_translations.seo_title as tr_seo_title' as UserProfileSelectColumn,
    'user_translations.seo_description as tr_seo_description' as UserProfileSelectColumn,

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
    'categories.is_active as c_is_active',
    'categories.type as c_type' as UserProfileSelectColumn,
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
        `AND category_translations.language_code = '${this.requestService.language ?? DEFAULT_LANGUAGE}'`,
      )
      .join(
        'id',
        TABLES_ENUM.USER_TRANSLATIONS,
        'user_id',
        'LEFT',
        `AND user_translations.language_code = '${this.requestService.language ?? DEFAULT_LANGUAGE}'`,
      )
      .get<UserProfileRow[]>();

    if (!result || result.length === 0) return null;

    return this.withShareReady(this.formatUserProfile(result));
  }

  async getUserProfileById(id: number): Promise<UserProfile | null> {
    const result = await this.query()
      .select(this.PROFILE_COLUMNS)
      .where('users.id', '=', id)
      .join('id', 'addresses', 'user_id', 'LEFT')
      .join('id', 'user_categories', 'user_id', 'LEFT')
      .join('user_categories.category_id', 'categories', 'id', 'LEFT')
      .join(
        'categories.id',
        TABLES_ENUM.CATEGORY_TRANSLATIONS,
        'category_id',
        'LEFT',
        `AND category_translations.language_code = '${this.requestService.language ?? DEFAULT_LANGUAGE}'`,
      )
      .join(
        'id',
        TABLES_ENUM.USER_TRANSLATIONS,
        'user_id',
        'LEFT',
        `AND user_translations.language_code = '${this.requestService.language ?? DEFAULT_LANGUAGE}'`,
      )
      .get<UserProfileRow[]>();

    if (!result || result.length === 0) return null;

    return this.withShareReady(this.formatUserProfile(result));
  }

  /**
   * Resolve `is_share_ready` for a formatted profile: the identity fields come from the row we
   * already have, the portfolio half needs one EXISTS check against the same predicate the sitemap
   * uses, so a profile can never be share-ready while being excluded from discovery.
   */
  private async withShareReady(
    profile: Omit<UserProfile, 'is_share_ready'>,
  ): Promise<UserProfile> {
    const result = await Query.raw(
      `SELECT EXISTS(
         SELECT 1 FROM ${TABLES_ENUM.PORTFOLIOS} pf
         WHERE pf.user_id = $1 AND pf.blocked_at IS NULL
           AND pf.is_active = true AND pf.is_indexable = true
       ) AS has_public_portfolio`,
      [profile.id],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const hasPublicPortfolio = Boolean(
      (Array.isArray(rows) ? rows : [])[0]?.has_public_portfolio,
    );

    return {
      ...profile,
      is_share_ready: isArtistShareReady({
        name: profile.name,
        profession: profile.profession,
        city: profile.address?.city,
        state: profile.address?.state,
        has_public_portfolio: hasPublicPortfolio,
      }),
    };
  }

  /**
   * Active non-banned public profiles with no SEO yet, or profile newer than last SEO generation.
   * Same role set as the sitemap, so anything enumerated there has generated SEO fields.
   */
  async findDueForSeoGeneration(): Promise<{ id: number; user_id: number }[]> {
    const result = await Query.raw(
      `SELECT u.id, u.id AS user_id
       FROM ${TABLES_ENUM.USERS} u
       INNER JOIN ${TABLES_ENUM.ROLES} r ON r.id = u.role_id
       WHERE ${UserRepository.PUBLIC_PROFILE_ROLES}
         AND u.banned = false
         AND u.is_active = true
         AND (
           u.seo_generated_at IS NULL
           OR (
             u.seo_generated_at < u.updated_at
             AND u.seo_generated_at < NOW() - (INTERVAL '1 day' * ${SEO_REGENERATION_MIN_INTERVAL_DAYS})
           )
         )
       ORDER BY u.updated_at ASC`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map((row: { id: number; user_id: number }) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
    }));
  }

  /**
   * Roles whose profiles are published under `/artists/*`. `findAllArtists` (the public directory)
   * filters on nothing but `banned`/`is_active`, so an ADMIN profile is already browsable and
   * linkable — restricting the sitemap to ARTIST alone would omit a page the site links to.
   */
  private static readonly PUBLIC_PROFILE_ROLES = `r.name IN ('ARTIST', 'ADMIN')`;

  /**
   * SQL mirror of `isArtistShareReady`: an artist only enters the sitemap with published work AND
   * the identity facts a listing needs (name, profession, locality). Shared by the enumeration and
   * its count so the two can never drift.
   */
  private static readonly SITEMAP_ARTIST_PREDICATE = `
    ${UserRepository.PUBLIC_PROFILE_ROLES} AND u.banned = false AND u.is_active = true
    AND BTRIM(COALESCE(u.name, '')) <> ''
    AND BTRIM(COALESCE(u.profession, '')) <> ''
    AND EXISTS(
      SELECT 1 FROM ${TABLES_ENUM.ADDRESSES} a
      WHERE a.user_id = u.id
        AND (BTRIM(COALESCE(a.city, '')) <> '' OR BTRIM(COALESCE(a.state, '')) <> '')
    )
    AND EXISTS(
      SELECT 1 FROM ${TABLES_ENUM.PORTFOLIOS} pf
      WHERE pf.user_id = u.id AND pf.blocked_at IS NULL
        AND pf.is_active = true AND pf.is_indexable = true
    )`;

  /**
   * Sitemap enumeration: active, non-banned public profiles that pass the share-ready quality gate
   * (skip empty/thin profiles). `is_paid` (an active, non-free subscription) sorts first so paid
   * artists land in the earliest sitemap shards (Google ignores `<priority>`, so shard order is the
   * real crawl-priority lever).
   */
  async getSitemapArtists(
    limit: number,
    offset: number,
  ): Promise<
    { username: string; updated_at: string; is_paid: boolean; avatar: string | null; banner: string | null }[]
  > {
    const result = await Query.raw(
      `SELECT u.username, u.updated_at, u.avatar, u.banner,
         EXISTS(
           SELECT 1 FROM ${TABLES_ENUM.PLAN_SUBSCRIPTIONS} ps
           JOIN ${TABLES_ENUM.PLAN_PRICES} pp ON pp.id = ps.plan_price_id
           JOIN ${TABLES_ENUM.PLANS} p ON p.id = pp.plan_id
           WHERE ps.user_id = u.id AND ps.is_active = true AND p.is_free = false
         ) AS is_paid
       FROM ${TABLES_ENUM.USERS} u
       INNER JOIN ${TABLES_ENUM.ROLES} r ON r.id = u.role_id
       WHERE ${UserRepository.SITEMAP_ARTIST_PREDICATE}
       ORDER BY is_paid DESC, u.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map(
      (row: { username: string; updated_at: string; is_paid: boolean; avatar: string | null; banner: string | null }) => ({
        username: row.username,
        updated_at: row.updated_at,
        is_paid: Boolean(row.is_paid),
        avatar: row.avatar ?? null,
        banner: row.banner ?? null,
      }),
    );
  }

  /** Count for `getSitemapArtists` (same predicate) — lets the web compute shard counts. */
  async countSitemapArtists(): Promise<number> {
    const result = await Query.raw(
      `SELECT COUNT(*)::int AS count
       FROM ${TABLES_ENUM.USERS} u
       INNER JOIN ${TABLES_ENUM.ROLES} r ON r.id = u.role_id
       WHERE ${UserRepository.SITEMAP_ARTIST_PREDICATE}`,
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return Number((Array.isArray(rows) ? rows : [])[0]?.count ?? 0);
  }

  /**
   * Persist the EN-fallback SEO onto the main row and stamp `seo_generated_at` via DB
   * `CURRENT_TIMESTAMP` (same statement) so it equals the trigger-set `updated_at` and the row
   * settles instead of being regenerated on every batch run.
   */
  async updateSeoById(id: number, seo: EntitySeoFields): Promise<void> {
    await Query.raw(
      `UPDATE ${TABLES_ENUM.USERS}
       SET seo_title = $1, seo_description = $2, seo_generated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [seo.seo_title ?? null, seo.seo_description ?? null, id],
    );
  }

  /** Upsert per-locale SEO rows into user_translations (one row per app language). */
  async upsertSeoTranslations(userId: number, rows: SeoTranslation[]): Promise<void> {
    for (const r of rows) {
      await Query.raw(
        `INSERT INTO ${TABLES_ENUM.USER_TRANSLATIONS} (language_code, user_id, seo_title, seo_description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (language_code, user_id)
         DO UPDATE SET seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description`,
        [r.language_code, userId, r.seo_title ?? null, r.seo_description ?? null],
      );
    }
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

  /** No-op at the DB level when `language` already matches, so calling this on every authenticated request doesn't churn the row. */
  async updateLanguageIfChanged(id: number, language: UserSchema['language']): Promise<void> {
    await this.query()
      .where('id', '=', id)
      .where('language', '!=', language)
      .update(['language'], [language]);
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
      language: result.language,
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
      phone_number: result?.phone_number ?? null,
      facebook_link: result?.facebook_link ?? null,
      website_link: result?.website_link ?? null,
      instagram_link: result?.instagram_link ?? null,
      youtube_link: result?.youtube_link ?? null,
      seo_title: result?.seo_title,
      seo_description: result?.seo_description,
      seo_generated_at: result?.seo_generated_at,
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

  /** `is_share_ready` is resolved separately (needs a portfolio lookup) — see `withShareReady`. */
  private formatUserProfile(rows: UserProfileRow[]): Omit<UserProfile, 'is_share_ready'> {
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
        is_active: row.c_is_active ?? true,
        type: row.c_type ?? 'DISCIPLINE',
      });
    }

    return {
      id: first.id,
      name: first.name,
      surname: first.surname,
      username: first.username,
      avatar: first.avatar,
      banner: first.banner,
      is_active: first.is_active,
      short_biography: first.short_biography,
      biography: first.biography,
      profession: first.profession ?? null,
      is_featured: first.is_featured,
      phone_number: first.phone_number ?? null,
      facebook_link: first.facebook_link ?? null,
      website_link: first.website_link ?? null,
      instagram_link: first.instagram_link ?? null,
      youtube_link: first.youtube_link ?? null,
      // Request-language SEO when that locale has a row; the main-row (EN) values otherwise.
      seo_title: first.tr_seo_title ?? first.seo_title,
      seo_description: first.tr_seo_description ?? first.seo_description,
      seo_generated_at: first.seo_generated_at,
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
    const lang = this.requestService.language ?? DEFAULT_LANGUAGE;
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
