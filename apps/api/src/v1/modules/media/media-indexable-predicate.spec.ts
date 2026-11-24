import { Query } from '@repo/database/facades';
import { MediaRepository as BaseMediaRepository } from '@repo/database/repositories/media';
import { RequestService } from 'src/common/services/request.service';
import { IndexNowRepository } from '../indexnow/indexnow.repository';
import { MediaRepository } from './media.repository';

jest.mock('@repo/database/facades', () => ({
  Query: { raw: jest.fn(), table: jest.fn() },
}));

const raw = Query.raw as jest.Mock;
/** Every SQL string passed to `Query.raw` so far. */
const sqlCalls = (): string[] => raw.mock.calls.map(([query]) => String(query));

/**
 * A media URL must be in the sitemap if and only if its page is indexable. Both sides read ONE SQL
 * constant, `INDEXABLE_MEDIA_PREDICATE`; these assertions fail the moment any reader inlines its own
 * copy or falls back to the looser `PUBLIC_MEDIA_PREDICATE`.
 */
describe('INDEXABLE_MEDIA_PREDICATE', () => {
  let repository: MediaRepository;

  beforeEach(() => {
    raw.mockReset();
    raw.mockResolvedValue({ rows: [] });
    repository = new MediaRepository({
      pagination: null,
      language: 'es',
    } as unknown as RequestService);
  });

  it('is the public rule plus the has-text rule', () => {
    expect(BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE).toContain(
      BaseMediaRepository.PUBLIC_MEDIA_PREDICATE,
    );
    expect(BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE).toContain(
      BaseMediaRepository.MEDIA_HAS_TEXT_SQL,
    );
  });

  it('counts blank text as missing, for the artist and the AI fields', () => {
    for (const column of ['m.title', 'm.description', 'm.seo_title', 'm.seo_description']) {
      expect(BaseMediaRepository.MEDIA_HAS_TEXT_SQL).toContain(
        `${BaseMediaRepository.nonBlankSql(column)} IS NOT NULL`,
      );
    }
  });

  /**
   * The page decides what to show with JS `.trim()` (`resolveMediaPageText`); the SQL must treat
   * the same strings as blank, or a whitespace-only field indexes a page that shows nothing.
   * Postgres E-string escapes, mapped to the characters they denote.
   */
  it('trims the whitespace JS trims (newline, tab, NBSP…), not only spaces', () => {
    const escapes: Record<string, string> = {
      '\\t': '\t', '\\n': '\n', '\\r': '\r', '\\f': '\f',
      '\\u000b': '\u000b', '\\u00a0': '\u00a0', '\\ufeff': '\ufeff',
    };
    const trimSet = /E' ((?:\\[a-z0-9]+)+)'/.exec(BaseMediaRepository.nonBlankSql('x'))?.[1] ?? '';
    const chars = [' ', ...(trimSet.match(/\\(?:u[0-9a-f]{4}|[a-z])/g) ?? []).map((e) => escapes[e])];

    // NBSP and BOM by code point, so an editor can't silently turn them into plain spaces.
    const NBSP = String.fromCharCode(0xa0);
    const BOM = String.fromCharCode(0xfeff);
    for (const blank of ['\n', '\t', NBSP, '  ', '\r\n', BOM, '\u000b\f']) {
      expect(blank.trim()).toBe('');
      expect([...blank].every((c) => chars.includes(c))).toBe(true);
    }
  });

  it('needs the AI title AND description, but either artist field alone', () => {
    const compact = BaseMediaRepository.MEDIA_HAS_TEXT_SQL.replace(/\s+/g, ' ');
    const nb = (c: string) => BaseMediaRepository.nonBlankSql(c);
    expect(compact).toContain(
      `(${nb('m.seo_title')} IS NOT NULL AND ${nb('m.seo_description')} IS NOT NULL)`,
    );
  });

  it('filters the sitemap rows and the sitemap count', async () => {
    await repository.getSitemapMedia(10, 0);
    await repository.countSitemapMedia();

    const [rows, count] = sqlCalls();
    expect(rows).toContain(BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE);
    expect(count).toContain(BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE);
  });

  it('decides the SEO metadata noindex, with blank-aware translation fallbacks', async () => {
    await repository.getSeoMetadataByPublicId('00000000-0000-0000-0000-000000000000');

    const [query] = sqlCalls();
    expect(query).toContain(
      `(${BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE}) AS is_indexable`,
    );
    expect(query).toContain(
      `COALESCE(${BaseMediaRepository.nonBlankSql('mt.seo_title')}, m.seo_title)`,
    );
    expect(query).toContain(
      `COALESCE(${BaseMediaRepository.nonBlankSql('mt.seo_description')}, m.seo_description)`,
    );
  });

  it('maps the flags it reads back', async () => {
    raw.mockResolvedValueOnce({
      rows: [{ username: 'a', is_public: true, is_indexable: false }],
    });
    await expect(
      repository.getSeoMetadataByPublicId('00000000-0000-0000-0000-000000000000'),
    ).resolves.toMatchObject({ is_public: true, is_indexable: false });
  });

  it('never submits a media IndexNow would not list in the sitemap', async () => {
    await new IndexNowRepository().changedPathsSince(new Date(0), 100);

    const [query] = sqlCalls();
    expect(query).toContain(BaseMediaRepository.INDEXABLE_MEDIA_PREDICATE);
  });
});
