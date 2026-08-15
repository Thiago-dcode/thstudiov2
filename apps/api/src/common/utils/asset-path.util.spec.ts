import { versionedAssetPath } from './asset-path.util';

describe('versionedAssetPath', () => {
  it('inserts the version before the extension', () => {
    expect(versionedAssetPath('users/abc/portfolio/my-slug/thumbnail.webp')).toMatch(
      /^users\/abc\/portfolio\/my-slug\/thumbnail-[0-9a-f]{8}\.webp$/,
    );
  });

  // The stored ContentType is derived from the extension, so a version appended after it would
  // serve every image as application/octet-stream.
  it('keeps the extension last', () => {
    expect(
      versionedAssetPath('categories/paint/thumbnail.webp').endsWith('.webp'),
    ).toBe(true);
  });

  it('appends the version when the key has no extension', () => {
    expect(versionedAssetPath('users/abc/avatar')).toMatch(
      /^users\/abc\/avatar-[0-9a-f]{8}$/,
    );
  });

  it('treats a dot in a parent directory as part of the path, not an extension', () => {
    expect(versionedAssetPath('assets/v1.2/banner')).toMatch(
      /^assets\/v1\.2\/banner-[0-9a-f]{8}$/,
    );
  });

  it('produces a different key on every call, so the CDN URL changes', () => {
    const key = 'users/abc/portfolio/my-slug/thumbnail.webp';

    expect(versionedAssetPath(key)).not.toBe(versionedAssetPath(key));
  });
});
