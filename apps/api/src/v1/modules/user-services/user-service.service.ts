import { Injectable } from "@nestjs/common";
import { Helpers } from "src/common/services/helpers.service";
import { FullService, Service, ServiceIndexRequest } from "@repo/common-lib/types/service";
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

  async slugExists(username: string, slug: string) {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return { exists: false };

    return {
      exists: await this.serviceRepository.slugExists(slug, user.id),
    };
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
