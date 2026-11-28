import {
  artistAboutPath,
  artistCollectionMediaPath,
  artistCollectionPath,
  artistListPath,
  artistMediaPath,
  artistPath,
  artistPathSql,
  artistPortfolioMediaPath,
  artistPortfolioPath,
  artistServicePath,
  parseArtistPath,
} from '../artist-path';

describe('artist path builders (AC-18, AC-24)', () => {
  it('AC-24: builds root URLs, never /artists/', () => {
    expect(artistPath('thsworld')).toBe('/thsworld');
    expect(artistAboutPath('thsworld')).toBe('/thsworld/about');
    expect(artistListPath('thsworld', 'portfolios')).toBe('/thsworld/portfolios');
    expect(artistListPath('thsworld', 'collections')).toBe('/thsworld/collections');
    expect(artistListPath('thsworld', 'services')).toBe('/thsworld/services');
    expect(artistPortfolioPath('thsworld', 'x')).toBe('/thsworld/portfolios/x');
    expect(artistCollectionPath('thsworld', 'c')).toBe('/thsworld/collections/c');
    expect(artistServicePath('thsworld', 's')).toBe('/thsworld/services/s');
    expect(artistMediaPath('thsworld', 'abc')).toBe('/thsworld/media/abc');
    expect(artistPortfolioMediaPath('thsworld', 'x', 'abc')).toBe('/thsworld/portfolios/x/media/abc');
    expect(artistCollectionMediaPath('thsworld', 'c', 'abc')).toBe('/thsworld/collections/c/media/abc');
  });

  it('AC-18: the entity canonical paths have the shapes the API emits', () => {
    expect(artistMediaPath('ana', 'pub-1')).toBe('/ana/media/pub-1');
    expect(artistPortfolioPath('ana', 'my-port')).toBe('/ana/portfolios/my-port');
    expect(artistCollectionPath('ana', 'my-col')).toBe('/ana/collections/my-col');
    expect(artistServicePath('ana', 'my-svc')).toBe('/ana/services/my-svc');
  });

  it('AC-24: no builder output contains /artists', () => {
    const all = [
      artistPath('u1x'), artistAboutPath('u1x'), artistListPath('u1x', 'services'),
      artistPortfolioPath('u1x', 's'), artistCollectionPath('u1x', 's'), artistServicePath('u1x', 's'),
      artistMediaPath('u1x', 'm'), artistPortfolioMediaPath('u1x', 's', 'm'), artistCollectionMediaPath('u1x', 's', 'm'),
    ];
    for (const p of all) expect(p).not.toContain('/artists');
  });

  it('encodes every segment', () => {
    expect(artistPath('a b')).toBe('/a%20b');
    expect(artistPortfolioPath('u/x', 'a/b?c#d')).toBe('/u%2Fx/portfolios/a%2Fb%3Fc%23d');
    expect(artistMediaPath('ana', 'id with space')).toBe('/ana/media/id%20with%20space');
  });

  it('AC-19: artistPathSql wraps the column for repository SQL', () => {
    expect(artistPathSql('u.username')).toBe("('/' || u.username)");
    expect(`${artistPathSql('u.username')} || '/portfolios/' || p.slug`).toBe(
      "('/' || u.username) || '/portfolios/' || p.slug",
    );
  });
});

describe('parseArtistPath', () => {
  it('parses root artist paths', () => {
    expect(parseArtistPath('/thsworld')).toEqual({ username: 'thsworld', rest: '' });
    expect(parseArtistPath('/thsworld/about')).toEqual({ username: 'thsworld', rest: '/about' });
    expect(parseArtistPath('/thsworld/portfolios/x/media/abc')).toEqual({
      username: 'thsworld',
      rest: '/portfolios/x/media/abc',
    });
  });

  it('returns the username as written and drops query and fragment', () => {
    expect(parseArtistPath('/ThsWorld/media/a?x=1#h')).toEqual({ username: 'ThsWorld', rest: '/media/a' });
    expect(parseArtistPath('/thsworld?x=1')).toEqual({ username: 'thsworld', rest: '' });
  });

  it.each([
    '/artists/thsworld',
    '/artists/thsworld/portfolios/x',
    '/Artists/thsworld/about',
    '/ARTISTS/thsworld',
    '/artists',
    '/artists/',
  ])('AC-18/AC-20: the legacy form %p returns null (no legacy parsing)', (p) => {
    expect(parseArtistPath(p)).toBeNull();
  });

  it.each(['', '/', 'thsworld', 'thsworld/about', '//thsworld', '/ab', '/a.b/x', '/x y/z'])(
    'returns null for junk %p',
    (p) => {
      expect(parseArtistPath(p)).toBeNull();
    },
  );

  it('returns null for a non-string', () => {
    expect(parseArtistPath(undefined as never)).toBeNull();
    expect(parseArtistPath(null as never)).toBeNull();
  });

  it('round-trips every builder', () => {
    expect(parseArtistPath(artistMediaPath('ana', 'id1'))).toEqual({ username: 'ana', rest: '/media/id1' });
    expect(parseArtistPath(artistServicePath('ana', 's1'))).toEqual({ username: 'ana', rest: '/services/s1' });
  });
});
