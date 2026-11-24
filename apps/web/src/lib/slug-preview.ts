import { slugBaseFromTitle } from "@repo/common-lib/utils/unique-slug";

export type SlugResource = "portfolio" | "service" | "collection";

const RESOURCE_SEGMENT: Record<SlugResource, string> = {
  portfolio: "portfolios",
  service: "services",
  collection: "collections",
};

/**
 * Client-side preview of the public address a title will get:
 * `{host}/artists/{username}/{resource}/{slug}`.
 *
 * Uses the same `slugBaseFromTitle` as the API, so the preview matches what gets saved,
 * except for the `-2`, `-3` suffix the server adds when the artist already uses that slug.
 * Returns `slug: null` while the title is empty so callers can show a placeholder.
 */
export function buildSlugPreview(args: {
  appUrl: string;
  username: string;
  resource: SlugResource;
  title: string;
}): { host: string; prefix: string; slug: string | null } {
  const host = args.appUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const prefix = `/artists/${args.username}/${RESOURCE_SEGMENT[args.resource]}/`;
  const slug = args.title.trim()
    ? slugBaseFromTitle(args.title, args.resource)
    : null;
  return { host, prefix, slug };
}
