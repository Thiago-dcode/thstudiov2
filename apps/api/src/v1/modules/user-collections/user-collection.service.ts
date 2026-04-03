import { Injectable } from "@nestjs/common";
import { Helpers } from "src/common/services/helpers.service";
import { FullCollection, Collection } from "@repo/common-lib/types/collection";
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

    return {
      ...collection,
      media: collection.media.length
        ? await Promise.all(collection.media.map(async (media) => ({
          ...media,
          thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
          url: media.url ? await this.helpers.getAsset(media.url) : undefined,
        })))
        : collection.media,
    };
  }

  async getByUsername(username: string, slug: string): Promise<FullCollection> {
    const user = await this.userRepository.findOneBy('username', username, 'COMPACT');
    if (!user) return null;

    return await this.getById(user.id, slug);
  }

  async getAllByUsername(username: string): Promise<Collection[]> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return [];

    return await this.collectionRepository.getAll({ user_id: user.id });
  }

  async slugExists(username: string, slug: string) {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return { exists: false };

    return {
      exists: await this.collectionRepository.slugExists(slug, user.id)
    };
  }
}
