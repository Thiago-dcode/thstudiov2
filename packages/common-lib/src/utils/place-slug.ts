import { foldLatinDiacritics } from './fold-latin-diacritics';
import { generateValidSlug } from './generate-valid-slug';

/**
 * The URL key of a country, state or city — the `madrid` in `/media/madrid/photography`.
 *
 * It is also what the hierarchy deduplicates on (unique within the parent), so "Málaga",
 * "Malaga" and " malaga " must all land on one row: diacritics are folded before slugging.
 * Unlike entity slugs there is no minimum length or fallback prefix — "Ys" is a real place.
 * A name with no Latin characters at all keeps its lowercased text, so it still gets a
 * stable, distinct key instead of colliding with every other such name on "".
 */
export function toPlaceSlug(name: string): string {
  const trimmed = (name ?? '').trim();
  return generateValidSlug(foldLatinDiacritics(trimmed)) || trimmed.toLowerCase().replace(/\s+/g, '-');
}
