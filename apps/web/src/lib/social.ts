/**
 * A11STUDIO's own official social accounts. Single source of truth: rendered as
 * icon links in the footer and emitted as `Organization.sameAs` in JSON-LD.
 * Add/remove an entry here and both surfaces update.
 *
 * Every profile is named exactly `A11STUDIO` and links back to https://a11studio.com — the mutual
 * links are what let search engines treat them as the same entity (docs/brand-search).
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/official_a11studio",
  linkedin: "https://www.linkedin.com/company/official-a11studio",
  youtube: "https://www.youtube.com/@official_a11studio",
  pinterest: "https://www.pinterest.com/a11studio",
} as const;

export type SocialKey = keyof typeof SOCIAL;
