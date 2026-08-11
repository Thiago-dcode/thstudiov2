import { cache } from "react";
import usersService from "./users.service";

/**
 * Whether the artist's public surface may be shared and indexed — the API's `is_share_ready`
 * (published work plus name, profession and locality). `cache` keeps the artist layout and every
 * breadcrumb on a page down to a single lookup per request.
 */
export const getArtistShareReady = cache(
  async (username: string): Promise<boolean> => {
    const { data } = await usersService.getProfile(username);
    return Boolean(data?.is_share_ready);
  },
);
