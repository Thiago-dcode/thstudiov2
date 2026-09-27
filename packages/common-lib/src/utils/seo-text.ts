/**
 * Collapse whitespace (incl. newlines from textarea input) to single spaces — meta values and
 * JSON-LD strings are single-line.
 */
export const collapseWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

/**
 * Words a cut must never end on (en/es/pt articles, prepositions, conjunctions) — a snippet ending
 * "…urban life and" or "…vida urbana e" reads as broken copy in the SERP and in share cards.
 */
const SEO_DANGLING_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'across',
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'de', 'del', 'en', 'con', 'por', 'para', 'al',
  'e', 'os', 'as', 'um', 'uma', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'em', 'com', 'que',
]);

/**
 * Fit an over-long SEO string into `max` characters without leaving a broken fragment.
 *
 * Prefers the last complete sentence when it keeps at least half the budget. Otherwise cuts on a word
 * boundary, drops trailing connectors/punctuation and closes with "…" so the reader sees an
 * intentional ellipsis rather than a sentence that stops mid-thought.
 */
export function truncateSeoText(text: string, max: number): string {
  if (text.length <= max) return text;
  const window = text.slice(0, max + 1);
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
    // A sentence ending exactly at the cut point.
    /[.!?]$/.test(window.slice(0, max)) ? max - 1 : -1,
  );
  if (sentenceEnd >= max * 0.5) return text.slice(0, sentenceEnd + 1).trim();

  // Room for the ellipsis.
  const words = text.slice(0, max - 1).split(' ');
  // The last piece is a partial word unless the cut fell exactly on a space.
  if (text.charAt(max - 1) !== ' ') words.pop();
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (last && !SEO_DANGLING_WORDS.has(last)) break;
    words.pop();
  }
  const body = words.join(' ').replace(/[\s,;:—–-]+$/u, '');
  return body ? `${body}…` : text.slice(0, max - 1).trimEnd() + '…';
}

/** Whitespace-collapsed and fitted to `max` (default 160, Google's description display). */
export const toMetaDescription = (text: string, max = 160): string =>
  truncateSeoText(collapseWhitespace(text), max);
