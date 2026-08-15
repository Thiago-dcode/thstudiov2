import { Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  ProfileStatusSchemaColumns,
  ProfileStatusSchemaWithoutTimestamps,
} from '@repo/common-lib/schemas/profile-status';
import {
  CreateProfileStatusInput,
  ProfileStatus,
  UpdateProfileStatusInput,
} from '@repo/common-lib/types/profile-status';
import { Query } from '@repo/database/facades';
import { BaseRepository } from '@repo/database/repositories';

@Injectable()
export class ProfileStatusRepository extends BaseRepository {
  private readonly COLUMNS: ProfileStatusSchemaColumns[] = [
    `${TABLES_ENUM.PROFILE_STATUS}.id`,
    `${TABLES_ENUM.PROFILE_STATUS}.user_id`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_full_name_field`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_profession_field`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_avatar_field`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_location`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_categories`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_portfolio`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_media`,
    `${TABLES_ENUM.PROFILE_STATUS}.has_about_page`,
  ] as const;

  constructor(protected readonly logService: LogService) {
    super(TABLES_ENUM.PROFILE_STATUS, logService);
  }

  async findByUserId(userId: number): Promise<ProfileStatus | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .first<ProfileStatusSchemaWithoutTimestamps>();
    if (!result) return null;
    return this.format(result);
  }

  async create(data: CreateProfileStatusInput): Promise<ProfileStatus> {
    const result = await super._create<ProfileStatusSchemaWithoutTimestamps>(
      data,
      { select: this.COLUMNS },
    );
    return this.format(result);
  }

  async updateByUserId(
    userId: number,
    data: UpdateProfileStatusInput,
  ): Promise<ProfileStatus> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length) {
      await this.query().where('user_id', '=', userId).update(columns, values);
    }
    const result = await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', userId)
      .first<ProfileStatusSchemaWithoutTimestamps>();
    return this.format(result);
  }

  /**
   * Idempotent backfill: upsert one row per user from live users / addresses /
   * categories / portfolios / media / about_page. Uses the unique (user_id) constraint.
   */
  async backfillAllFromLiveData(): Promise<number> {
    const ps = TABLES_ENUM.PROFILE_STATUS;
    const users = TABLES_ENUM.USERS;
    const addresses = TABLES_ENUM.ADDRESSES;
    const userCategories = TABLES_ENUM.USER_CATEGORIES;
    const portfolios = TABLES_ENUM.PORTFOLIOS;
    const media = TABLES_ENUM.MEDIA;
    const aboutPage = TABLES_ENUM.ABOUT_PAGE;

    const result = await Query.raw(
      `INSERT INTO ${ps} (
         user_id,
         has_full_name_field,
         has_profession_field,
         has_avatar_field,
         has_location,
         has_categories,
         has_portfolio,
         has_media,
         has_about_page,
         created_at,
         updated_at
       )
       SELECT
         u.id,
         (BTRIM(COALESCE(u.name, '')) <> '' AND BTRIM(COALESCE(u.surname, '')) <> ''),
         (BTRIM(COALESCE(u.profession, '')) <> ''),
         (BTRIM(COALESCE(u.avatar, '')) <> ''),
         EXISTS (
           SELECT 1 FROM ${addresses} a
           WHERE a.user_id = u.id
             AND (
               BTRIM(COALESCE(a.country, '')) <> ''
               OR BTRIM(COALESCE(a.city, '')) <> ''
               OR BTRIM(COALESCE(a.formated_address, '')) <> ''
             )
         ),
         EXISTS (SELECT 1 FROM ${userCategories} uc WHERE uc.user_id = u.id),
         EXISTS (SELECT 1 FROM ${portfolios} p WHERE p.user_id = u.id),
         EXISTS (SELECT 1 FROM ${media} m WHERE m.user_id = u.id),
         EXISTS (SELECT 1 FROM ${aboutPage} ap WHERE ap.user_id = u.id),
         NOW(),
         NOW()
       FROM ${users} u
       ON CONFLICT (user_id) DO UPDATE SET
         has_full_name_field = EXCLUDED.has_full_name_field,
         has_profession_field = EXCLUDED.has_profession_field,
         has_avatar_field = EXCLUDED.has_avatar_field,
         has_location = EXCLUDED.has_location,
         has_categories = EXCLUDED.has_categories,
         has_portfolio = EXCLUDED.has_portfolio,
         has_media = EXCLUDED.has_media,
         has_about_page = EXCLUDED.has_about_page,
         updated_at = NOW()`,
    );

    const rowCount =
      (Array.isArray(result) ? result[1] : result?.rowCount) ??
      result?.rows?.length ??
      0;
    return typeof rowCount === 'number' ? rowCount : Number(rowCount) || 0;
  }

  private format(result: ProfileStatusSchemaWithoutTimestamps): ProfileStatus {
    return {
      id: result.id,
      user_id: result.user_id,
      has_full_name_field: result.has_full_name_field,
      has_profession_field: result.has_profession_field,
      has_avatar_field: result.has_avatar_field,
      has_location: result.has_location,
      has_categories: result.has_categories,
      has_portfolio: result.has_portfolio,
      has_media: result.has_media,
      has_about_page: result.has_about_page,
    };
  }
}
