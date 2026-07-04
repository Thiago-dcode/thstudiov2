import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetsRepository } from './assets.repository';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { Helpers } from 'src/common/services/helpers.service';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import { CreateAssetInput, Asset } from '@repo/common-lib/types/assets';
import { ASSET_SIGNED_URL_EXPIRATION } from '@repo/common-lib/constants/constants';
import path from 'path';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB

function validateThumbnail(file: Express.Multer.File): void {
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    throw new BadRequestException(`Thumbnail must be an image (jpeg, png, webp, gif, avif). Got: ${file.mimetype}`);
  }
  if (file.size > MAX_THUMBNAIL_SIZE) {
    throw new BadRequestException(`Thumbnail must be less than 2MB. Got: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly storageService: StorageService,
    private readonly helpers: Helpers,
  ) { }

  async create(
    file: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    dto: { title?: string; description?: string; slug?: string; filename?: string },
  ): Promise<Asset> {

    // Validate thumbnail if provided
    if (thumbnailFile) {
      validateThumbnail(thumbnailFile);
    }
    const originalFilename = dto.filename || file.originalname;
    const title = dto.title ?? path.parse(originalFilename).name;

    let slug = dto.slug;
    if (!slug) {
      slug = generateValidSlug(title);
    }

    if (await this.assetsRepository.slugExists(slug)) {
      throw new BadRequestException(`Slug "${slug}" already exists`);
    }

    const storagePath = `assets/${slug}/${originalFilename}`;



    // Store file to S3
    await this.storageService.write(file, storagePath);

    // Store thumbnail to S3 if provided
    let thumbnailPath: string | null = null;
    if (thumbnailFile) {
      thumbnailPath = `assets/${slug}/thumbnail/${originalFilename}`;
      await this.helpers.setAsset({ asset: thumbnailFile, path: thumbnailPath, targetSizeMb: 0.1 });
    }

    // Create DB record
    const assetData: CreateAssetInput = {
      url: storagePath,
      thumbnail: thumbnailPath,
      slug,
      title,
      description: dto.description ?? null,
      filename: originalFilename,
    };

    const asset = await this.assetsRepository.create(assetData);
    await this.helpers.deleteCached(`asset:slug:${slug}`);

    // Return asset with resolved URLs
    return {
      ...asset,
      url: await this.helpers.getAsset(asset.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
      thumbnail: asset.thumbnail
        ? await this.helpers.getAsset(asset.thumbnail, { expireIn: ASSET_SIGNED_URL_EXPIRATION })
        : null,
    };
  }

  async findAll(): Promise<Asset[]> {
    const assets = await this.assetsRepository.findAll();
    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        url: await this.helpers.getAsset(asset.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
        thumbnail: asset.thumbnail
          ? await this.helpers.getAsset(asset.thumbnail, { expireIn: ASSET_SIGNED_URL_EXPIRATION })
          : null,
      })),
    );
  }

  async deleteBySlug(slug: string): Promise<void> {
    const asset = await this.assetsRepository.findBySlug(slug);
    if (!asset) {
      throw new NotFoundException(`Asset not found with slug ${slug}`);
    }

    await Promise.all([this.helpers.deleteAsset(asset.url), this.helpers.deleteAsset(asset?.thumbnail), this.assetsRepository.deleteBySlug(slug),this.helpers.deleteCached(`asset:slug:${slug}`)]);
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
          thumbnail: asset.thumbnail
            ? await this.helpers.getAsset(asset.thumbnail, { expireIn: ASSET_SIGNED_URL_EXPIRATION })
            : null,
        };
      })(),
      { ttl: ASSET_SIGNED_URL_EXPIRATION * 950 },
    );
  }
}
