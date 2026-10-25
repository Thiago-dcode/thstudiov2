import { Injectable } from '@nestjs/common';
import { Query } from '@repo/database/facades';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { ReserveUsernameInput, UsernameRedirect } from '@repo/common-lib/types/username-history';

type CurrentUsernameRow = { current_username: string };

@Injectable()
export class UsernameHistoryRepository extends BaseRepository {
  constructor() {
    super(TABLES_ENUM.USERNAME_HISTORY);
  }

  /**
   * Whether `username` is still reserved for someone other than `exceptUserId`. A user's own
   * reservation never blocks them, so they can always take back a name they moved away from.
   */
  async isReservedForOtherUser(username: string, exceptUserId?: number): Promise<boolean> {
    const query = this.query()
      .where('username', '=', username)
      .where('reserved_until', '>', new Date());
    if (exceptUserId !== undefined) {
      query.where('user_id', '!=', exceptUserId);
    }
    return await query.exists();
  }

  /**
   * Reserves `username` for `user_id` until `reserved_until`. A row left behind by an earlier owner
   * (only possible once its reservation expired, since an active one blocks the name) is taken over.
   */
  async reserve({ user_id, username, reserved_until }: ReserveUsernameInput): Promise<void> {
    await Query.raw(
      `INSERT INTO ${TABLES_ENUM.USERNAME_HISTORY} (user_id, username, reserved_until, created_at, updated_at)
       VALUES ($1, $2, $3::timestamptz, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE
         SET user_id = EXCLUDED.user_id,
             reserved_until = EXCLUDED.reserved_until,
             updated_at = NOW();`,
      [user_id, username, reserved_until.toISOString()],
    );
  }

  /**
   * The user's previous usernames that are still reserved, i.e. still 308 to the current one.
   * At most a few rows, read through the `user_id` index.
   */
  async findReservedByUser(userId: number): Promise<string[]> {
    const rows = await this.query()
      .select(['username'])
      .where('user_id', '=', userId)
      .where('reserved_until', '>', new Date())
      .get<{ username: string }[]>();
    return (rows ?? []).map((row) => row.username);
  }

  /** Drops the user's reservation of `username`, once they have taken that name back. */
  async release(userId: number, username: string): Promise<void> {
    await this.query().where('user_id', '=', userId).where('username', '=', username).delete();
  }

  /**
   * The current username behind an actively reserved old one. Only for owners whose profile is
   * public (the `PublicArtistGuard` rule): a banned, deactivated or closing account 404s anyway, and
   * its old name must not reveal what it is called now.
   */
  async findRedirect(username: string): Promise<UsernameRedirect> {
    const result = await Query.raw(
      `SELECT u.username AS current_username
       FROM ${TABLES_ENUM.USERNAME_HISTORY} h
       JOIN ${TABLES_ENUM.USERS} u ON u.id = h.user_id
       WHERE h.username = $1
         AND h.reserved_until > NOW()
         AND u.banned = false
         AND u.is_active = true
         AND u.deletion_requested_at IS NULL
         AND u.username <> h.username
         -- A live owner always wins, even over a row a cache or a race left behind.
         AND NOT EXISTS (SELECT 1 FROM ${TABLES_ENUM.USERS} live WHERE lower(live.username) = h.username)
       LIMIT 1;`,
      [username],
    );
    const rows: CurrentUsernameRow[] = Array.isArray(result) ? result[0] : result?.rows ?? [];
    const row = rows?.[0];
    return row ? { username: row.current_username } : null;
  }
}
