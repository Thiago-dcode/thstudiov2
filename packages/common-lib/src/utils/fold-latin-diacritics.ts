/**
 * Folds Latin diacritics (e.g. Î → I, é → e) for locale-style matching.
 * Uses Unicode NFD + stripping of combining marks; pairs with PostgreSQL unaccent() for address filters.
 */
export function foldLatinDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Trim, fold diacritics, lowercase — for comparing filter text to location entity names. */
export function foldLatinDiacriticsForMatch(value: string): string {
  return foldLatinDiacritics(value.trim()).toLowerCase();
}
