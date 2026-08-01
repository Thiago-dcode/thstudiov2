import { serverEnv } from "@/env/server";
import { SOCIAL } from "@/lib/social";
import { version } from "../../package.json";

export const config = {
  encryption_secret: serverEnv.ENCRYPTION_SECRET,
  app_url: serverEnv.APP_URL,
  api_v1_url: serverEnv.API_V1_URL,
  geoapi_url: serverEnv.GEOAPIFY_URL,
  geoapi_key: serverEnv.GEOAPIFY_KEY,
  app_name: "a11studio",
  app_version: version,
};

/**
 * A11STUDIO's own official social/profile URLs → emitted as `Organization.sameAs`
 * (brand entity disambiguation for Google knowledge panel + AI answer engines).
 * Derived from the single {@link SOCIAL} source so it always matches the footer.
 */
export const ORGANIZATION_SAME_AS: string[] = Object.values(SOCIAL);

/**
 * Fallback Open Graph / Twitter image for pages that would otherwise have none — the imageless
 * marketing/utility pages (landing, about, faqs, legal, support, search) and artists with no
 * banner/avatar. Root-relative on purpose: Next resolves it to an absolute URL via the root
 * layout's `metadataBase`, so share previews are never blank.
 */
export const DEFAULT_OG_IMAGE = "/logo/logo_bg_white.png";
