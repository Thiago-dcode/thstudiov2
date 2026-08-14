import { Injectable } from "@nestjs/common";
import { Helpers } from "src/common/services/helpers.service";
import { FullService, Service, ServiceIndexRequest } from "@repo/common-lib/types/service";
import { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import { CACHE_KEY_SERVICE_SEO, SEO_METADATA_CACHE_TTL } from "@repo/common-lib/constants/constants";
import { UserRepository } from "../users/users.repository";
import { ServiceRepository } from "../services/service.repository";

/** Nest cache-manager TTL (ms). */
const CACHE_TTL = 1000 * 60 * 60 * 24;
/** Same window as `CACHE_TTL` — `getAsset` / S3 presign uses seconds. */
const CACHE_TTL_SECONDS = CACHE_TTL / 1000;

export const serviceCacheKeys = {
  bySlug: (userId: number, slug: string) => `service-${userId}-${slug}`,
  allByUser: (userId: number) => `services-user-${userId}`,
  highlightCount: (userId: number) => `service-highlight-count-${userId}`,
};

@Injectable()
export class UserServiceService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
    private readonly helpers: Helpers,
  ) { }

  async getById(userId: number, slug: string): Promise<FullService> {
    return this.resolveFullService(userId, slug);
  }

  async getByUsername(username: string, slug: string): Promise<FullService> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;

    return this.resolveFullService(user.id, slug);
  }

  /** Lean, locale-resolved SEO for generateMetadata — no full-graph load. */
  async getSeoMetadata(username: string, slug: string): Promise<EntitySeoMetadata | null> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;
    // Cache the thumbnail PATH (stable); sign `og_image` fresh per request (presigned URL expires ~1h).
    const cached = await this.helpers.cacheRemember(
      CACHE_KEY_SERVICE_SEO(user.id, slug),
      async () => {
        const meta = await this.serviceRepository.getSeoMetadataBySlug(slug, user.id);
        if (!meta) return null;
        return {
          seo_title: meta.seo_title,
          seo_description: meta.seo_description,
          thumbnail_path: meta.thumbnail,
          canonical_path: `/artists/${username}/services/${slug}`,
          noindex: !meta.is_indexable,
        };
      },
      { ttl: SEO_METADATA_CACHE_TTL, append_language: true },
    );
    if (!cached) return null;
    const { thumbnail_path, ...rest } = cached;
    return {
      ...rest,
      og_image: thumbnail_path ? await this.helpers.getAsset(thumbnail_path) : null,
    };
  }

  async getAllByUsername(
    username: string,
    filters?: Omit<ServiceIndexRequest, "user_id">,
  ): Promise<Service[]> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return [];

    if (this.shouldCacheServicesList(filters)) {
      return this.helpers.cacheRemember(
        serviceCacheKeys.allByUser(user.id),
        this.resolveAllServices(user.id),
        { append_language: false, ttl: CACHE_TTL },
      );
    }

    return this.resolveAllServices(user.id, filters);
  }

  private shouldCacheServicesList(
    filters?: Omit<ServiceIndexRequest, "user_id">,
  ): boolean {
    if (filters == null) return true;
    const { paginated, page, is_featured, is_highlight, is_active, blocked } = filters;
    return (
      paginated !== true &&
      (page === undefined || page <= 1) &&
      typeof is_featured !== "boolean" &&
      typeof is_highlight !== "boolean" &&
      typeof is_active !== "boolean" &&
      typeof blocked !== "boolean"
    );
  }

  private async resolveFullService(userId: number, slug: string): Promise<FullService> {
    const service = await this.serviceRepository.getBySlug(slug, userId);
    if (!service) return null;

    if (service.thumbnail) {
      service.thumbnail = await this.helpers.getAsset(service.thumbnail, { expireIn: CACHE_TTL_SECONDS });
    }

    return service;
  }

  private async resolveAllServices(
    userId: number,
    filters?: Omit<ServiceIndexRequest, "user_id">,
  ): Promise<Service[]> {
    const services = await this.serviceRepository.getAll({
      user_id: userId,
      ...filters,
    });

    return await Promise.all(
      services.map(async (service) => ({
        ...service,
        thumbnail: service.thumbnail
          ? await this.helpers.getAsset(service.thumbnail, {
              expireIn: CACHE_TTL_SECONDS,
            })
          : undefined,
      })),
    );
  }
}
