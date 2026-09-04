import { MimeTypes } from "../types/general";
import { EnumType } from "./enums";

// ==================== APP CONFIGURATION ====================
export const FUNNEL_LAST_STEP = 5;
export const ALLOWED_IMAGE_FILE_TYPES: MimeTypes[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_FILE_TYPES: MimeTypes[] = ['video/mp4', 'video/quicktime', 'video/mpeg'];
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_FILE_TYPES, ...ALLOWED_VIDEO_FILE_TYPES];

/**
 * Single source of truth for the image upload cap. Enforced at every layer that touches an
 * upload (browser selection, the Next proxy routes/server actions and the API's multer config)
 * so a rejection always carries the same number. Lossless PNG photos routinely land in the
 * 15-25MB range, which is why this sits well above a typical JPEG.
 */
export const MAX_IMAGE_UPLOAD_MB = 25;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
/**
 * The video cap is what sets nginx's `client_max_body_size` (320m, leaving headroom for the
 * multipart envelope) and Next's server-action `bodySizeLimit` — keep all three in sync, in
 * `dev.nginx`/`pro.nginx` and `apps/web/next.config.ts`. A raw phone clip is 10-20 Mbps, so
 * 300MB is a few minutes of 1080p; the worker transcodes it down to a delivery bitrate.
 */
export const MAX_VIDEO_UPLOAD_MB = 300;
export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;
/**
 * Videos over this are rejected, never trimmed — silently cutting someone's footage is data
 * loss they did not ask for. Checked in the browser (`HTMLVideoElement.duration`) so the user
 * finds out in a second rather than after a 300MB upload, and again in the worker's ffprobe
 * pass, which is the only place that cannot be bypassed.
 *
 * Ten minutes is deliberately generous relative to the byte cap: 300MB over 10 minutes is only
 * ~4 Mbps, so anything reaching this limit is low-bitrate long-form rather than portfolio work.
 */
export const MAX_VIDEO_DURATION_SECONDS = 600;
export const STRIKES_TO_BAN = 3;
/**
 * LLM usage types that count against a user's AI credit quota. Only user-initiated
 * generation counts; platform-driven background SEO (portfolio/collection/service/user
 * metadata crons) is billed to the platform, not the artist. Keep this in sync wherever
 * AI credits are counted or the "credits exhausted" email is triggered.
 */
export const CREDIT_CONSUMING_LLM_USAGE_TYPES: EnumType<'LLM_USAGE_TYPE'>[] = [
  'GENERATE_MEDIA_METADATA',
];
export const MAX_USERNAME_RESET = 3;
export const MAX_PASSWORD_RESET = 3;
export const MAX_COLLECTION_ITEMS = 30;
export const MAX_PORTFOLIO_ITEMS = 100;
/** Per-type category caps for a portfolio; the combined total is their sum. */
export const MAX_DISCIPLINES_PORTFOLIO = 3;
export const MAX_STYLES_PORTFOLIO = 3;
export const MAX_CATEGORIES_PORTFOLIO =
  MAX_DISCIPLINES_PORTFOLIO + MAX_STYLES_PORTFOLIO;
/** Categories a user can pick for their profile (disciplines and art styles share the budget). */
export const MAX_CATEGORIES_USER = 3;
/** Max LLM-assigned content TAGS per media (bounds the pivot + JSON-LD keywords array). */
export const MAX_TAGS_MEDIA = 8;
/**
 * Platform-wide currency for service prices. Services have no per-listing currency column, so the
 * visible price symbol AND the JSON-LD `Offer.priceCurrency` both derive from here — keep them in
 * sync (Google penalizes a structured-data price that doesn't match the visible one).
 */
export const PLATFORM_CURRENCY = "EUR";
export const PLATFORM_CURRENCY_SYMBOL = "€";
/** Postgres `real` (4-byte float) tops out around 3.4e38; keep prices well under that and sane for a service listing. */
export const MAX_SERVICE_PRICE = 999999.99;
export const MIN_COLUMN_BASE_COLUMNS = 1;
export const MAX_COLUMN_BASE_COLUMNS = 12;
/**
 * COLUMN_BASE is responsive: the configured column count is the desktop
 * maximum, and smaller viewports are capped so cells never get too small.
 */
export const COLUMN_BASE_RESPONSIVE_CAPS = {
  /** < 768px */
  mobile: 2,
  /** 768px – 1279px */
  tablet: 4,
  /** >= 1280px (full configured count, up to MAX_COLUMN_BASE_COLUMNS) */
  desktop: MAX_COLUMN_BASE_COLUMNS,
} as const;

// Ban duration in days based on ban_count. null = permanent ban.
export const BAN_DURATION_DAYS: Record<number, number | null> = {
  1: 3,    // 3 days
  2: 7,    // 1 week
  3: 14,   // 2 weeks
  4: 30,   // 1 month
};
export const PERMANENT_BAN_THRESHOLD = 5;
