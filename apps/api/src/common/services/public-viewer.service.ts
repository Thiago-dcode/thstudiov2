import { Injectable } from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import type { UserAuth } from '@repo/common-lib/types/auth';
import { RequestService } from 'src/common/services/request.service';
import { AuthHelper } from 'src/v1/modules/auth/auth-helper.service';

const ADMIN_ROLE_NAME: EnumType<'USER_ROLE'> = 'ADMIN';

/**
 * The optional caller of a `@Public()` route. The global `AuthGuard` skips public routes, so the
 * bearer token (captured by `RequestMiddleware`) is resolved here, at most once per request, and
 * only when something asks: anonymous visitors never pay for it.
 */
@Injectable()
export class PublicViewerService {
  constructor(
    private readonly authHelper: AuthHelper,
    private readonly requestService: RequestService,
  ) { }

  /** The caller, or `null` when anonymous or the token is invalid or expired. */
  async get(): Promise<UserAuth | null> {
    if (this.requestService.user) return this.requestService.user;
    const resolved = this.requestService.viewer;
    if (resolved !== undefined) return resolved;

    const token = this.requestService.bearer_token;
    let viewer: UserAuth | null = null;
    if (token) {
      try {
        viewer = await this.authHelper.resolveUserAuth(token);
      } catch {
        viewer = null;
      }
    }
    this.requestService.viewer = viewer;
    return viewer;
  }

  isAdmin(viewer: UserAuth | null): boolean {
    return viewer?.role?.name === ADMIN_ROLE_NAME;
  }

  /**
   * Whether the caller may see what visitors can't (inactive or blocked entities): the owner, or an
   * admin. With no `ownerId` (a cross-artist list) only an admin qualifies.
   */
  async canSeeHidden(ownerId?: number | null): Promise<boolean> {
    const viewer = await this.get();
    if (!viewer) return false;
    if (this.isAdmin(viewer)) return true;
    return ownerId != null && viewer.id === ownerId;
  }
}
