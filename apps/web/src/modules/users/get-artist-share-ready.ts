import type { ApiResponse } from "@repo/common-lib/types/response";
import type { UserProfile } from "@repo/common-lib/types/user";
import { cache } from "react";
import usersService from "./users.service";

/**
 * The artist's public profile response. `cache` keeps `generateMetadata`, the page, the artist layout
 * and every breadcrumb on a request down to a single lookup — pages need it for the artist's display
 * name, locality and discipline in titles and structured data. The raw response (not just `data`) is
 * kept so callers can tell "this artist does not exist" (→ 404) from "the API is down" (→ never 404).
 */
export const getArtistProfileResponse = cache(
  (username: string): Promise<ApiResponse<UserProfile>> =>
    usersService.getProfile(username),
);

/** The artist's public profile, or null when it does not exist or could not be loaded. */
export const getArtistProfile = cache(
  async (username: string): Promise<UserProfile | null> =>
    (await getArtistProfileResponse(username)).data ?? null,
);

/**
 * Whether the artist's public surface may be shared and indexed — the API's `is_share_ready`
 * (published work plus name, profession and locality).
 */
export const getArtistShareReady = cache(
  async (username: string): Promise<boolean> =>
    Boolean((await getArtistProfile(username))?.is_share_ready),
);
