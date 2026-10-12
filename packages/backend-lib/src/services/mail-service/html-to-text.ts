const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  middot: '·',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

const decodeEntities = (value: string) =>
  value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });

/**
 * Plain-text alternative for a rendered email.
 *
 * Gmail reads an HTML-only message as a marketing-tool signature (it's one of the inputs to the
 * Promotions tab); transactional senders ship a `text/plain` part alongside. Tailored to our own
 * table-based templates, not arbitrary HTML: links keep their URL — a text part whose call to
 * action can't be followed is worse than none.
 */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(head|style|script)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, label: string) => {
      const cleanLabel = label.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const url = decodeEntities(href).trim();
      if (!url || url.startsWith('mailto:') || cleanLabel === url) return cleanLabel || url;
      return cleanLabel ? `${cleanLabel}: ${url}` : url;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|tr|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
