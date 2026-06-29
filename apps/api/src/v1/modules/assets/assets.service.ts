import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetsRepository } from './assets.repository';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { Helpers } from 'src/common/services/helpers.service';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import { CreateAssetInput, UpdateAssetInput, Asset } from '@repo/common-lib/types/assets';
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
      title: dto.title || null,
      description: dto.description || null,
      filename: dto.filename || slug,
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

  async update(
    slug: string,
    dto: UpdateAssetInput,
    file?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ): Promise<Asset> {
    const existing = await this.assetsRepository.findBySlug(slug);
    if (!existing) {
      throw new NotFoundException(`Asset not found with slug ${slug}`);
    }

    if (thumbnailFile) {
      validateThumbnail(thumbnailFile);
    }

    const urlUpdate: { url?: string; thumbnail?: string; filename?: string } = {};
    let targetSlug = existing.slug;

    if (dto.slug && dto.slug !== existing.slug) {
      let uniqueSlug = dto.slug;
      let counter = 1;
      while (await this.assetsRepository.slugExists(uniqueSlug)) {
        uniqueSlug = `${dto.slug}-${counter}`;
        counter++;
      }
      dto.slug = uniqueSlug;
      targetSlug = uniqueSlug;

      const filename = existing.url.split('/').pop() || 'file';
      const newStoragePath = `assets/${uniqueSlug}/${filename}`;

      await this.helpers.moveAsset(existing.url, newStoragePath);
      urlUpdate.url = newStoragePath;

      if (existing.thumbnail) {
        const thumbnailFilename = existing.thumbnail.split('/').pop() || 'thumbnail';
        const newThumbnailPath = `assets/${uniqueSlug}/thumbnail/${thumbnailFilename}`;
        await this.helpers.moveAsset(existing.thumbnail, newThumbnailPath);
        urlUpdate.thumbnail = newThumbnailPath;
      }
    }

    if (file) {
      const originalFilename = dto.filename || file.originalname;
      const newStoragePath = `assets/${targetSlug}/${originalFilename}`;
      const currentUrl = urlUpdate.url ?? existing.url;

      await this.storageService.write(file, newStoragePath);

      if (currentUrl !== newStoragePath) {
        await this.helpers.deleteAsset(currentUrl);
      } else {
        await this.helpers.invalidateAssetCache(newStoragePath);
      }

      urlUpdate.url = newStoragePath;
      urlUpdate.filename = dto.filename || originalFilename;
    } else if (dto.filename && dto.filename !== existing.filename) {
      const currentUrl = urlUpdate.url ?? existing.url;
      const newStoragePath = `assets/${targetSlug}/${dto.filename}`;

      if (currentUrl !== newStoragePath) {
        await this.helpers.moveAsset(currentUrl, newStoragePath);
        urlUpdate.url = newStoragePath;
        urlUpdate.filename = dto.filename;
      }
    }

    if (thumbnailFile) {
      const thumbnailFilename = thumbnailFile.originalname;
      const thumbnailPath = `assets/${targetSlug}/thumbnail/${thumbnailFilename}`;
      await this.helpers.setAsset({ asset: thumbnailFile, path: thumbnailPath, targetSizeMb: 0.1 });
      urlUpdate.thumbnail = thumbnailPath;
    }

    const updated = await this.assetsRepository.updateBySlug(slug, { ...dto, ...urlUpdate });

    const cacheKeys = [`asset:slug:${slug}`];
    if (dto.slug && dto.slug !== slug) {
      cacheKeys.push(`asset:slug:${dto.slug}`);
    }

    const storageChanged = !!(file || thumbnailFile
      || (dto.slug && dto.slug !== existing.slug)
      || (dto.filename && dto.filename !== existing.filename));

    if (storageChanged) {
      cacheKeys.push(
        existing.url,
        existing.thumbnail,
        urlUpdate.url,
        urlUpdate.thumbnail,
      );
    }

    await this.helpers.deleteManyCached(cacheKeys.filter(Boolean) as string[]);

    return {
      ...updated,
      url: await this.helpers.getAsset(updated.url, { expireIn: ASSET_SIGNED_URL_EXPIRATION }),
      thumbnail: updated.thumbnail
        ? await this.helpers.getAsset(updated.thumbnail, { expireIn: ASSET_SIGNED_URL_EXPIRATION })
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
