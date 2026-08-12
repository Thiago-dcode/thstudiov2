import { Injectable } from '@nestjs/common';
import {
  SitemapArtistItem,
  SitemapCounts,
  SitemapEntityItem,
  SitemapMediaItem,
} from '@repo/common-lib/types/sitemap';
import { Helpers } from 'src/common/services/helpers.service';
import { UserRepository } from '../users/users.repository';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { CollectionRepository } from '../collections/collection.repository';
import { MediaRepository } from '../media/media.repository';
import { ServiceRepository } from '../services/service.repository';

/** Upper bound on `per_page` so a single call can't ask for an unbounded page. */
const MAX_PER_PAGE = 5000;

@Injectable()
export class SitemapService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly helpers: Helpers,
  ) {}

  private normalize(page?: number, perPage?: number): { limit: number; offset: number } {
    const safePerPage = Math.min(Math.max(Number(perPage) || 1000, 1), MAX_PER_PAGE);
    const safePage = Math.max(Number(page) || 0, 0);
    return { limit: safePerPage, offset: safePage * safePerPage };
  }

  /** Sign a batch of storage paths into absolute image URLs (CloudFront-ready via `getAsset`). */
  private async signImages(paths: (string | null)[]): Promise<string[]> {
    const valid = paths.filter((p): p is string => Boolean(p));
    if (!valid.length) return [];
    return Promise.all(valid.map((p) => this.helpers.getAsset(p)));
  }

  async counts(): Promise<SitemapCounts> {
    const [artists, portfolios, collections, services, media] = await Promise.all([
      this.userRepository.countSitemapArtists(),
      this.portfolioRepository.countSitemapPortfolios(),
      this.collectionRepository.countSitemapCollections(),
      this.serviceRepository.countSitemapServices(),
      this.mediaRepository.countSitemapMedia(),
    ]);
    return { artists, portfolios, collections, services, media };
  }

  async artists(page?: number, perPage?: number): Promise<SitemapArtistItem[]> {
    const { limit, offset } = this.normalize(page, perPage);
    const rows = await this.userRepository.getSitemapArtists(limit, offset);
    return Promise.all(
      rows.map(async (row) => ({
        username: row.username,
        updated_at: row.updated_at,
        is_paid: row.is_paid,
        images: await this.signImages([row.avatar, row.banner]),
      })),
    );
  }

  async portfolios(
    page?: number,
    perPage?: number,
    imageCap = 10,
  ): Promise<SitemapEntityItem[]> {
    const { limit, offset } = this.normalize(page, perPage);
    const rows = await this.portfolioRepository.getSitemapPortfolios(limit, offset, imageCap);
    return Promise.all(
      rows.map(async (row) => ({
        username: row.username,
        slug: row.slug,
        updated_at: row.updated_at,
        images: await this.signImages(row.image_paths),
      })),
    );
  }

  async collections(
    page?: number,
    perPage?: number,
    imageCap = 10,
  ): Promise<SitemapEntityItem[]> {
    const { limit, offset } = this.normalize(page, perPage);
    const rows = await this.collectionRepository.getSitemapCollections(limit, offset, imageCap);
    return Promise.all(
      rows.map(async (row) => ({
        username: row.username,
        slug: row.slug,
        updated_at: row.updated_at,
        images: await this.signImages(row.image_paths),
      })),
    );
  }

  /**
   * Media detail pages. They carry the richest structured data in the app (`ImageObject` /
   * `VisualArtwork` with a licensable pair and keywords) and were previously in no sitemap at all.
   */
  async media(page?: number, perPage?: number): Promise<SitemapMediaItem[]> {
    const { limit, offset } = this.normalize(page, perPage);
    const rows = await this.mediaRepository.getSitemapMedia(limit, offset);
    return Promise.all(
      rows.map(async (row) => ({
        username: row.username,
        public_id: row.public_id,
        updated_at: row.updated_at,
        images: await this.signImages([row.thumbnail]),
      })),
    );
  }

  async services(page?: number, perPage?: number): Promise<SitemapEntityItem[]> {
    const { limit, offset } = this.normalize(page, perPage);
    const rows = await this.serviceRepository.getSitemapServices(limit, offset);
    return Promise.all(
      rows.map(async (row) => ({
        username: row.username,
        slug: row.slug,
        updated_at: row.updated_at,
        images: await this.signImages([row.thumbnail]),
      })),
    );
  }
}
