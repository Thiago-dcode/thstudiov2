import { toPlaceSlug } from '../place-slug';

describe('toPlaceSlug', () => {
  it('folds diacritics and case so spellings of one place share a key', () => {
    expect(toPlaceSlug('Málaga')).toBe('malaga');
    expect(toPlaceSlug(' malaga ')).toBe('malaga');
    expect(toPlaceSlug('São Paulo')).toBe('sao-paulo');
  });

  it('keeps short real place names', () => {
    expect(toPlaceSlug('Ys')).toBe('ys');
  });

  it('falls back to the lowercased text for non-Latin names', () => {
    expect(toPlaceSlug('東京 都')).toBe('東京-都');
  });

  it('returns an empty string for blank input', () => {
    expect(toPlaceSlug('   ')).toBe('');
  });
});
