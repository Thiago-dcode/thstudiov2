import { foldLatinDiacritics, foldLatinDiacriticsForMatch } from '../fold-latin-diacritics';

describe('foldLatinDiacritics', () => {
  it('strips French circumflex so state names align with ASCII reference data', () => {
    expect(foldLatinDiacritics('Île-de-France')).toBe('Ile-de-France');
  });

  it('lowercases and trims in foldLatinDiacriticsForMatch', () => {
    expect(foldLatinDiacriticsForMatch('  Île-de-France ')).toBe('ile-de-france');
  });
});
