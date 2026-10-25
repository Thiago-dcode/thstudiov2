export type PurgeArtistEdgeCacheJobInput = {
  user_id: number;
  /**
   * Names to purge on top of the ones the processor resolves itself (current + still-reserved old
   * usernames). Needed after a hard delete, when the user row is already gone.
   */
  usernames?: string[];
};
