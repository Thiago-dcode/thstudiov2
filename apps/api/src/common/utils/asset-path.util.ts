import { randomBytes } from 'node:crypto';

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
 * `users/x/avatar` → `users/x/avatar-3f9a1c04`
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
