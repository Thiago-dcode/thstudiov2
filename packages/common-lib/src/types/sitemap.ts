/**
 * Types for the dedicated sitemap endpoints (`/api/v1/sitemap/*`). These power the Next.js
 * sharded sitemap index and are intentionally lean — only what a `<url>` entry needs.
 *
 * `images` are already resolved to absolute URLs by the API (the repositories return raw storage
 * paths; the sitemap service signs them via `Helpers.getAsset`). Once CloudFront lands, the same
 * call yields stable URLs with no shape change here.
 */

export interface SitemapCounts {
  artists: number;
  portfolios: number;
  collections: number;
  services: number;
}

/** Artist profile URL data. `is_paid` drives ordering (paid users into the earliest shards). */
export interface SitemapArtistItem {
  username: string;
  updated_at: string;
  is_paid: boolean;
  /** Cover images (avatar/banner) for the image-sitemap extension. */
  images: string[];
}

/** A slugged entity (portfolio / collection / service) URL, keyed by `username` + `slug`. */
export interface SitemapEntityItem {
  username: string;
  slug: string;
  updated_at: string;
  /** Gallery/cover images for the image-sitemap extension. */
  images: string[];
}
