/**
 * Whether an artist profile is complete enough to be shared and indexed as a real artist page.
 *
 * All four signals are required (strict AND): a share card or a search result built from a profile
 * that is still being filled in reads as a finished portfolio and cannot be un-cached once a
 * messenger or crawler has seen it. The same predicate gates the sitemap enumeration, so discovery
 * and per-page robots can never disagree.
 */
export type ArtistShareReadyInput = {
  name?: string | null;
  profession?: string | null;
  city?: string | null;
  state?: string | null;
  /** At least one portfolio that is active, indexable and not blocked. */
  has_public_portfolio: boolean;
};

const isFilled = (value?: string | null): boolean => Boolean(value?.trim());

export function isArtistShareReady(input: ArtistShareReadyInput): boolean {
  return (
    input.has_public_portfolio &&
    isFilled(input.name) &&
    isFilled(input.profession) &&
    // Either half of the locality is enough — the visible summary and JSON-LD both fall back to state.
    (isFilled(input.city) || isFilled(input.state))
  );
}
