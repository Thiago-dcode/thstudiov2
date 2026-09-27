import sharp from "sharp";
import { serverEnv } from "@/env/server";
import { cdnHost, STORAGE_IMAGE_HOSTS } from "@/lib/image-hosts";
import {
  DEFAULT_OG_IMAGE_PATH,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "@/lib/seo/core";

/**
 * `/og-image.jpg?src=<our CDN/S3 image URL>` → a 1200×630 JPEG share card.
 *
 * Link previews (WhatsApp above all, also iMessage, LinkedIn, Facebook) are strict about the image
 * they will render: WebP support is inconsistent, anything over ~300 KB is dropped, a non-image
 * `Content-Type` is rejected, and a portrait image is cropped to a sliver of the 1.91:1 card. Our
 * sources break every one of those rules somewhere — portrait WebP thumbnails, 600 KB+ banners,
 * extensionless avatars served as `application/octet-stream` — so every page's `og:image` points
 * here instead (see `ogImage()` in `lib/seo/core.ts`).
 *
 * The whole artwork is kept (contained, never cropped) over a blurred, darkened fill of itself, so a
 * portrait photograph still reads as a full-width card.
 *
 * Lives at a dotted path on purpose: `proxy.ts` skips dotted paths, so the locale middleware never
 * rewrites it, and a `.jpg` URL is cached by Cloudflare by extension.
 */

/** Hard ceiling for the encoded card; WhatsApp stops rendering previews above roughly this. */
const MAX_BYTES = 280 * 1024;
/** Sources are our own processed uploads (≤ a few MB); anything larger is not an image we made. */
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
/** Descending JPEG qualities to try until the card fits `MAX_BYTES`. */
const QUALITIES = [82, 72, 62, 52];

const allowedHosts = (): Set<string> => {
  const hosts = new Set<string>(STORAGE_IMAGE_HOSTS);
  const cdn = cdnHost();
  if (cdn) hosts.add(cdn.hostname);
  return hosts;
};

/** Only https URLs on our own storage hosts — this route must never fetch arbitrary URLs. */
const parseSource = (raw: string | null): URL | null => {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return allowedHosts().has(url.hostname) ? url : null;
  } catch {
    return null;
  }
};

/** Behind nginx `request.url` can carry the internal host, so redirect on the public origin. */
const fallback = () =>
  Response.redirect(new URL(DEFAULT_OG_IMAGE_PATH, serverEnv.APP_URL), 307);

async function renderCard(source: Buffer): Promise<Buffer> {
  // `rotate()` applies EXIF orientation; `failOn: "none"` tolerates slightly damaged uploads.
  const input = sharp(source, { failOn: "none" }).rotate();

  const [backdrop, artwork] = await Promise.all([
    input
      .clone()
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, { fit: "cover" })
      .blur(30)
      .modulate({ brightness: 0.55 })
      .toBuffer(),
    input
      .clone()
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
        fit: "inside",
        withoutEnlargement: false,
      })
      .toBuffer({ resolveWithObject: true }),
  ]);

  const composed = sharp(backdrop).composite([
    {
      input: artwork.data,
      left: Math.round((OG_IMAGE_WIDTH - artwork.info.width) / 2),
      top: Math.round((OG_IMAGE_HEIGHT - artwork.info.height) / 2),
    },
  ]);
  const flattened = await composed.toBuffer();

  let out: Buffer = Buffer.alloc(0);
  for (const quality of QUALITIES) {
    out = await sharp(flattened)
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();
    if (out.byteLength <= MAX_BYTES) break;
  }
  return out;
}

export async function GET(request: Request) {
  const src = parseSource(new URL(request.url).searchParams.get("src"));
  if (!src) return fallback();

  try {
    const res = await fetch(src, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // The source URLs are versioned per upload, so the fetched bytes can be cached aggressively.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    const length = Number(res.headers.get("content-length") ?? 0);
    if (!res.ok || length > MAX_SOURCE_BYTES) return fallback();

    const source = Buffer.from(await res.arrayBuffer());
    if (source.byteLength > MAX_SOURCE_BYTES) return fallback();

    const card = await renderCard(source);
    return new Response(new Uint8Array(card), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(card.byteLength),
        // Browsers a day; shared caches (Cloudflare) a month. A source edit mints a new source URL,
        // hence a new card URL, so nothing ever needs purging.
        "Cache-Control":
          "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fallback();
  }
}
