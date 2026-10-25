/**
 * Something an artist's public pages (`/artists/{username}/**`, every locale) render has changed,
 * so their edge-cached HTML must be purged. Emit only after the write and any in-method cache
 * invalidation, so the purge never runs ahead of the data.
 */
export class ArtistPublicPagesChangedEvent {
  constructor(
    public readonly userId: number,
    /** Names the processor cannot resolve itself, e.g. after a hard delete removed the row. */
    public readonly usernames?: string[],
  ) {}
}
