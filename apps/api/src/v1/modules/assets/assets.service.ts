import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetsRepository } from './assets.repository';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { Helpers } from 'src/common/services/helpers.service';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import { CreateAssetInput, UpdateAssetInput, Asset } from '@repo/common-lib/types/assets';
import { ASSET_SIGNED_URL_EXPIRATION } from '@repo/common-lib/constants/constants';
import path from 'path';

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly storageService: StorageService,
    private readonly helpers: Helpers,
  ) {}

  async create(
    file: Express.Multer.File,
    dto: { title?: string; description?: string; slug?: string; filename?: string },
  ): Promise<Asset> {
    const originalFilename = dto.filename || file.originalname;
    const extension = path.extname(file.originalname).replace('.', '') || 'bin';

    // Generate slug from title if not provided, fallback to filename
    let slug = dto.slug;
    if (!slug) {
      const slugSource = dto.title || path.parse(originalFilename).name;
      slug = generateValidSlug(slugSource);
    }

    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.assetsRepository.slugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    slug = uniqueSlug;

    const storagePath = `assets/${extension}/${slug}`;

    // Store file to S3
    await this.storageService.write(file, storagePath);

    // Create DB record
    const assetData: CreateAssetInput = {
      url: storagePath,
      slug,
      title: dto.title || null,
      description: dto.description || null,
      filename: dto.filename || slug,
    };

    const asset = await this.assetsRepository.create(assetData);

    // Return asset with resolved URL
    return {
      ...asset,
      url: await this.helpers.getAsset(asset.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
    };
  }

  async update(
    id: number,
    dto: UpdateAssetInput,
  ): Promise<Asset> {
    // Find by id (throw if not found)
    const existing = await this.assetsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Asset not found with id ${id}`);
    }

    // If slug is changing, ensure uniqueness and update storage path
    let urlUpdate: { url?: string } = {};
    if (dto.slug && dto.slug !== existing.slug) {
      // Ensure new slug is unique
      let uniqueSlug = dto.slug;
      let counter = 1;
      while (await this.assetsRepository.slugExists(uniqueSlug)) {
        uniqueSlug = `${dto.slug}-${counter}`;
        counter++;
      }
      dto.slug = uniqueSlug;

      // Derive new storage path from slug
      const extension = existing.url.split('/')[1] || 'bin';
      const newStoragePath = `assets/${extension}/${uniqueSlug}`;

      // Move file in S3
      await this.storageService.move(existing.url, newStoragePath);
      urlUpdate.url = newStoragePath;
    }

    // Update metadata + url if slug changed
    const updated = await this.assetsRepository.updateById(id, { ...dto, ...urlUpdate });

    // Return updated asset with resolved URL
    return {
      ...updated,
      url: await this.helpers.getAsset(updated.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
    };
  }

  async getOneBySlug(slug: string): Promise<Asset> {
    return this.helpers.cacheRemember(
      `asset:slug:${slug}`,
      (async () => {
        const asset = await this.assetsRepository.findBySlug(slug);
        if (!asset) {
          throw new NotFoundException(`Asset not found with slug ${slug}`);
        }

        return {
          ...asset,
          url: await this.helpers.getAsset(asset.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
        };
      })(),
      { ttl: ASSET_SIGNED_URL_EXPIRATION * 1000 },
    );
  }
}
