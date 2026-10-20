import { Injectable } from "@nestjs/common";
import { Helpers } from "src/common/services/helpers.service";
import { FullCollection, Collection, CollectionIndexRequest } from "@repo/common-lib/types/collection";
import { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import type { MediaVisibility } from "@repo/common-lib/types/media";
import {
  CACHE_KEY_COLLECTION_SEO,
  SEO_METADATA_CACHE_TTL,
} from "@repo/common-lib/constants/cache";
import { UserRepository } from "../users/users.repository";
import { CollectionRepository } from "../collections/collection.repository";
import { PublicViewerService } from "src/common/services/public-viewer.service";
import { PUBLIC_ENTITY_FILTERS, isHiddenFromPublic } from "src/common/utils/public-entity";

@Injectable()
export class UserCollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly userRepository: UserRepository,
    private readonly helpers: Helpers,
    private readonly publicViewer: PublicViewerService,
  ) { }

  /** The owner's editor: includes media they switched off, so a save keeps them in the collection. */
  async getForOwner(userId: number, slug: string): Promise<FullCollection> {
    return this.getById(userId, slug, { includeInactive: true });
  }

  async getById(
    userId: number,
    slug: string,
    visibility: MediaVisibility = {},
  ): Promise<FullCollection> {
    const collection = await this.collectionRepository.getBySlug(slug, userId, visibility);
    if (!collection) return null;
    // Inactive and blocked collections exist only for their owner and admins: a 404 for anyone else.
    if (isHiddenFromPublic(collection) && !(await this.publicViewer.canSeeHidden(collection.user_id))) {
      return null;
    }

    const [media, tags] = await Promise.all([
      collection.media.length
        ? Promise.all(collection.media.map(async (media) => ({
          ...media,
          thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
          video_preview: media.video_preview ? await this.helpers.getAsset(media.video_preview) : undefined,
          url:  media.url ? await this.helpers.getAsset(media.url) : undefined,
        })))
        : Promise.resolve(collection.media),
      // Aggregate the media's content tags → CollectionPage.keywords (localized).
      this.collectionRepository.getTagsByCollectionId(collection.id),
    ]);

    return { ...collection, media, tags };
  }

  /** Lean, locale-resolved SEO for generateMetadata — no full-graph load. */
  async getSeoMetadata(username: string, slug: string): Promise<EntitySeoMetadata | null> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;
    // Cache the cover PATH (stable); `og_image` is resolved per request like the other entities.
    const cached = await this.helpers.cacheRemember(
      CACHE_KEY_COLLECTION_SEO(user.id, slug),
      async () => {
        const meta = await this.collectionRepository.getSeoMetadataBySlug(slug, user.id);
        if (!meta) return null;
        return {
          title: meta.title,
          description: meta.description,
          seo_title: meta.seo_title,
          seo_description: meta.seo_description,
          cover_path: meta.cover,
          canonical_path: `/artists/${user.username}/collections/${slug}`,
          noindex: !meta.is_public,
        };
      },
      { ttl: SEO_METADATA_CACHE_TTL, append_language: true },
    );
    if (!cached) return null;
    const { cover_path, ...rest } = cached;
    return {
      ...rest,
      og_image: cover_path ? await this.helpers.getAsset(cover_path) : null,
    };
  }

  async getByUsername(username: string, slug: string): Promise<FullCollection> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;

    return await this.getById(user.id, slug);
  }

  async getAllByUsername(
    username: string,
    filters?: Omit<CollectionIndexRequest, 'user_id'>,
  ): Promise<Collection[]> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return [];

    const visibility = (await this.publicViewer.canSeeHidden(user.id)) ? {} : PUBLIC_ENTITY_FILTERS;
    const result = await this.collectionRepository.getAll({ user_id: user.id, ...filters, ...visibility });
    return Promise.all(
      result.map(async (co) => {
        const media = await Promise.all(
          co.media.map(async (cm) => {
            if (!cm.thumbnail) return cm;
            return {
              ...cm,
              thumbnail: await this.helpers.getAsset(cm.thumbnail),
            };
          }),
        );
        return { ...co, media };
      }),
    );
  }

}
