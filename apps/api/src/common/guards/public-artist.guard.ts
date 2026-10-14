import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import type { UserAuth } from '@repo/common-lib/types/auth';
import { Query } from '@repo/database/facades';
import type { Request } from 'express';
import { RequestService } from 'src/common/services/request.service';
import { AuthHelper } from 'src/v1/modules/auth/auth-helper.service';

type ArtistVisibilityRow = {
  id: number;
  banned: boolean;
  is_active: boolean;
  deletion_requested_at: Date | null;
};

const ADMIN_ROLE_NAME: EnumType<'USER_ROLE'> = 'ADMIN';
const NOT_FOUND = 'Artist not found';

/**
 * Guards the artist routes addressed by `:username`, `:user_id`, `:id` or a media `:public_id`
 * (resolved to the media's owner): 404 unless the account
 * exists and is publicly visible — not banned, not deactivated by its owner, not pending deletion
 * (the rule `visibleAccountSql` encodes for list queries). It runs before the Redis-cached service
 * reads, so hiding an account takes effect at once, and an unknown username is a 404 too: after a
 * hard delete the username's cached payloads must never be served again.
 *
 * Exceptions, so the atelier keeps working (it reads its own data through these same routes):
 * - the owner of a DEACTIVATED account (a pending-deletion owner sits behind the blocking modal,
 *   and their public pages must 404 for them too);
 * - admins (support).
 * On `@Public()` routes the global `AuthGuard` never resolves the caller, so the bearer token is
 * checked here — and only for a hidden account, so visible ones never pay for it.
 */
@Injectable()
export class PublicArtistGuard implements CanActivate {
  constructor(
    private readonly authHelper: AuthHelper,
    private readonly requestService: RequestService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const artist = await this.findArtist(request.params ?? {});
    if (artist === undefined) return true; // route without an artist param
    if (!artist) throw new NotFoundException(NOT_FOUND);
    if (!artist.banned && artist.is_active && !artist.deletion_requested_at) return true;

    const caller = await this.resolveCaller(request);
    if (caller?.role?.name === ADMIN_ROLE_NAME) return true;
    const isDeactivatedOnly = !artist.banned && !artist.deletion_requested_at;
    if (isDeactivatedOnly && caller?.id === artist.id) return true;

    throw new NotFoundException(NOT_FOUND);
  }

  /** `undefined`: no artist param on this route; `null`: no such user. */
  private async findArtist(
    params: Record<string, string | string[] | undefined>,
  ): Promise<ArtistVisibilityRow | null | undefined> {
    const query = Query.table(TABLES_ENUM.USERS).select([
      'id',
      'banned',
      'is_active',
      'deletion_requested_at',
    ]);

    if (typeof params.username === 'string') {
      const username = params.username.toLocaleLowerCase().trim();
      if (!username) return null;
      // `lower(username)`, not `username`: the only index is `uq_users_username_normalized` on
      // lower(username), and this runs on every public artist request — a plain `username =`
      // would scan the whole users table each time.
      const result = await Query.raw(
        `SELECT id, banned, is_active, deletion_requested_at
         FROM ${TABLES_ENUM.USERS} WHERE lower(username) = $1 LIMIT 1`,
        [username],
      );
      const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
      return (Array.isArray(rows) ? (rows[0] as ArtistVisibilityRow | undefined) : undefined) ?? null;
    }

    // Media pages: the artist is the media's owner. An unknown media id is a 404 like the rest.
    if (typeof params.public_id === 'string') {
      const result = await Query.raw(
        `SELECT u.id, u.banned, u.is_active, u.deletion_requested_at
         FROM ${TABLES_ENUM.MEDIA} m
         INNER JOIN ${TABLES_ENUM.USERS} u ON u.id = m.user_id
         WHERE m.public_id = $1
         LIMIT 1`,
        [params.public_id],
      );
      const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
      return (Array.isArray(rows) ? (rows[0] as ArtistVisibilityRow | undefined) : undefined) ?? null;
    }

    const rawId = params.user_id ?? params.id;
    if (rawId === undefined) return undefined;
    if (typeof rawId !== 'string') return null;
    // Same contract as the routes' `ParseIntPipe`, checked here first so a non-numeric id never
    // reaches the query.
    if (!/^\d{1,10}$/.test(rawId)) return null;
    return (await query.where('id', '=', Number(rawId)).first<ArtistVisibilityRow | null>()) ?? null;
  }

  /** The authenticated caller: set by `AuthGuard` on protected routes, else from the bearer token. */
  private async resolveCaller(request: Request): Promise<UserAuth | null> {
    if (this.requestService.user) return this.requestService.user;
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) return null;
    try {
      return await this.authHelper.resolveUserAuth(token);
    } catch {
      return null;
    }
  }
}
