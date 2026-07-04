import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  AssetSchema,
  AssetSchemaColumns,
} from '@repo/common-lib/schemas/assets';
import {
  CreateAssetInput,
  Asset,
} from '@repo/common-lib/types/assets';

@Injectable()
export class AssetsRepository extends BaseRepository {
  private readonly COLUMNS: AssetSchemaColumns[] = [
    'assets.id',
    'assets.url',
    'assets.thumbnail',
    'assets.slug',
    'assets.title',
    'assets.description',
    'assets.filename',
    'assets.created_at',
    'assets.updated_at',
  ] as const;

  constructor(
    protected readonly logService: LogService,
  ) {
    super('assets', logService);
  }

  async findById(id: number): Promise<Asset | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('assets.id', '=', id)
      .first<AssetSchema>();
    if (!result) return null;
    return this.formatAsset(result);
  }

  async findBySlug(slug: string): Promise<Asset | null> {
    const result = await this.query()
      .select(this.COLUMNS)
      .where('assets.slug', '=', slug)
      .first<AssetSchema>();
    if (!result) return null;
    return this.formatAsset(result);
  }

  async slugExists(slug: string): Promise<boolean> {
    const result = await this.query()
      .select(['assets.id'])
      .where('assets.slug', '=', slug)
      .first<{ id: number }>();
    return !!result;
  }

  async findAll(): Promise<Asset[]> {
    const results = await this.query()
      .select(this.COLUMNS)
      .orderBy('created_at', 'DESC')
      .get<AssetSchema[]>();
    return results.map((result) => this.formatAsset(result));
  }

  async create(data: CreateAssetInput): Promise<Asset> {
    const result = await super._create<AssetSchema>(data, {
      select: this.COLUMNS,
    });
    return this.formatAsset(result);
  }

  async deleteBySlug(slug: string): Promise<void> {
    await this.query().where('slug', '=', slug).delete();
  }

  private formatAsset(result: AssetSchema): Asset {
    return {
      id: result.id,
      url: result.url,
      thumbnail: result.thumbnail ?? null,
      slug: result.slug,
      title: result.title,
      description: result.description,
      filename: result.filename,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }
}
