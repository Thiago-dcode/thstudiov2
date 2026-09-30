import { randomBytes } from 'node:crypto';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';

/** Bytes of randomness per key; hex-encoded, so the suffix is twice this many characters. */
const VERSION_BYTES = 4;

/**
 * Appends a per-upload version to an asset key, keeping any extension last.
 *
 * Public assets are served straight from the CDN at a stable, unsigned path — with `CDN_URL` set,
 * `S3StorageService.getUrl` returns `${cdnUrl}/${key}` and never signs, so the URL for a given key
 * is byte-identical forever. Overwriting an object in place therefore changed nothing any client
 * could see: CloudFront, the browser cache and the `next/image` optimizer all keep serving the
 * previous bytes, and a successful save appeared to do nothing.
 *
 * Giving every upload its own key makes the URL change, so those caches miss naturally instead of
 * needing a CDN invalidation (which is billed, asynchronous, and would still show the old image for
 * the first seconds after saving). Callers must delete the previously stored path, otherwise the
 * superseded objects are orphaned in the bucket.
 *
 * The extension is preserved because `S3StorageService` derives the stored `ContentType` from it;
 * moving it would serve every image as `application/octet-stream`.
 *
 * `users/x/portfolio/my-slug/thumbnail.webp` → `users/x/portfolio/my-slug/thumbnail-3f9a1c04.webp`
 * `users/x/avatar.webp` → `users/x/avatar-3f9a1c04.webp` (an extensionless key would be served as
 * `application/octet-stream`, which link-preview scrapers and Google Images reject)
 */
export const versionedAssetPath = (path: string): string => {
  const version = randomBytes(VERSION_BYTES).toString('hex');

  const lastSlash = path.lastIndexOf('/');
  const directory = path.slice(0, lastSlash + 1);
  const filename = path.slice(lastSlash + 1);

  // `> 0` not `>= 0`: a leading dot is a hidden-file name, not an extension separator.
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) {
    return `${path}-${version}`;
  }

  return `${directory}${filename.slice(0, dot)}-${version}${filename.slice(dot)}`;
};

/** Longest slug kept before the kind suffix, so keys (and CDN URLs) stay readable. */
const DESCRIPTIVE_NAME_MAX = 60;

/**
 * A descriptive file name for an image key — `thiago-ferreira-landscape-photographer-avatar.webp`
 * rather than `avatar.webp`. Google Images reads the file name as a (small) relevance signal, and
 * media files already get AI-written names; profile images and covers were the generic exception.
 *
 * Accents are folded before slugging (`generateValidSlug` drops non-ASCII letters, so "Coruña"
 * would become "corua"). Empty parts are skipped, and with nothing left the result is just the
 * kind, so the key is never worse than before. Pass the result through {@link versionedAssetPath}.
 */
export const descriptiveFilename = (
  parts: (string | null | undefined)[],
  kind: string,
  extension = 'webp',
): string => {
  const folded = parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const slug = generateValidSlug(folded).slice(0, DESCRIPTIVE_NAME_MAX).replace(/-+$/, '');
  return `${slug ? `${slug}-` : ''}${kind}.${extension}`;
};
