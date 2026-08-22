import { Injectable } from "@nestjs/common";
import { Helpers } from "src/common/services/helpers.service";
import { FullCollection, Collection, CollectionIndexRequest } from "@repo/common-lib/types/collection";
import { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import {
  CACHE_KEY_COLLECTION_SEO,
  SEO_METADATA_CACHE_TTL,
} from "@repo/common-lib/constants/cache";
import { UserRepository } from "../users/users.repository";
import { CollectionRepository } from "../collections/collection.repository";

@Injectable()
export class UserCollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly userRepository: UserRepository,
    private readonly helpers: Helpers,
  ) { }

  async getById(userId: number, slug: string): Promise<FullCollection> {
    const collection = await this.collectionRepository.getBySlug(slug, userId);
    if (!collection) return null;

    const [media, tags] = await Promise.all([
      collection.media.length
        ? Promise.all(collection.media.map(async (media) => ({
          ...media,
          thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
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
    return this.helpers.cacheRemember(
      CACHE_KEY_COLLECTION_SEO(user.id, slug),
      async () => {
        const meta = await this.collectionRepository.getSeoMetadataBySlug(slug, user.id);
        if (!meta) return null;
        return {
          seo_title: meta.seo_title,
          seo_description: meta.seo_description,
          og_image: null,
          canonical_path: `/artists/${username}/collections/${slug}`,
          noindex: !meta.is_indexable,
        };
      },
      { ttl: SEO_METADATA_CACHE_TTL, append_language: true },
    );
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

    const result = await this.collectionRepository.getAll({ user_id: user.id, ...filters });
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
