/**
 * A11STUDIO's own official social accounts. Single source of truth: rendered as
 * icon links in the footer and emitted as `Organization.sameAs` in JSON-LD.
 * Add/remove an entry here and both surfaces update.
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/a11studio.app",
  linkedin: "https://www.linkedin.com/company/a11-studio",
} as const;

export type SocialKey = keyof typeof SOCIAL;
