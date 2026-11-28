import {
  CACHE_KEY_COLLECTION_SEO,
  CACHE_KEY_MEDIA_SEO,
  CACHE_KEY_PORTFOLIO_SEO,
  CACHE_KEY_SERVICE_SEO,
} from '../cache';

describe('SEO cache key versions (AC-18)', () => {
  it('AC-18: portfolio, collection and service SEO keys are on seo_v3_', () => {
    expect(CACHE_KEY_PORTFOLIO_SEO(1, 'x')).toBe('seo_v3_portfolio_1_x');
    expect(CACHE_KEY_COLLECTION_SEO(1, 'x')).toBe('seo_v3_collection_1_x');
    expect(CACHE_KEY_SERVICE_SEO(1, 'x')).toBe('seo_v3_service_1_x');
  });

  it('AC-18: the media SEO key is on seo_v4_', () => {
    expect(CACHE_KEY_MEDIA_SEO('abc')).toBe('seo_v4_media_abc');
  });
});
