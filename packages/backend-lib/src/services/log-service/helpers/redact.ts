export const REDACTED = '[REDACTED]';
export const CIRCULAR = '[Circular]';
export const MAX_DEPTH_MARKER = '[MaxDepth]';

const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 100;

/**
 * Keys whose *normalized* form contains one of these is redacted. Safe as substrings:
 * no benign field name in the codebase embeds them.
 */
const SENSITIVE_KEY_SUBSTRINGS = [
  'password',
  'secret',
  'token',
  'apikey',
  'privatekey',
  'accesskey',
  'credential',
  'invitationcode',
  'twofacode',
];

/**
 * Keys redacted only on an exact normalized match.
 *
 * A bare `code` is deliberately absent: in this codebase it is an error code
 * (`ECONNREFUSED`, a Postgres SQLSTATE, a Stripe `decline_code`, a process exit code) and
 * redacting it strips the single most diagnostic field from an error log. The secret-bearing
 * code fields here are `twofa_code` and `invitation_code`, both already covered by
 * SENSITIVE_KEY_SUBSTRINGS, so nothing is lost by letting `code` through.
 */
const SENSITIVE_KEYS_EXACT = new Set([
  'card',
  'cvv',
  'cvc',
  'pin',
  'otp',
  'session',
  'cookie',
  'setcookie',
  'authorization',
  'auth',
]);

/** Emails are masked rather than dropped: `au***@example.com` still identifies a session. */
const EMAIL_KEY_SUBSTRING = 'email';

/** `new_password` and `X-Api-Key` must normalize onto the same rules as `password`/`apikey`. */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return (
    SENSITIVE_KEYS_EXACT.has(normalized) ||
    SENSITIVE_KEY_SUBSTRINGS.some((needle) => normalized.includes(needle))
  );
}

/**
 * Route params that carry a credential when they appear in a URL. A bare `code` is safe as a
 * log key (see SENSITIVE_KEYS_EXACT) but in a path it is always a one-time or invitation code
 * (`/invitation-links/:code/code`, `/wait-list/invitation/:code`).
 */
const SENSITIVE_PATH_PARAMS_EXACT = new Set(['code']);

export function isSensitivePathParam(name: string): boolean {
  return isSensitiveKey(name) || SENSITIVE_PATH_PARAMS_EXACT.has(normalizeKey(name));
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * `@domain.tld` inside free text (provider errors, exception messages); the local part in front of
 * it is found by {@link maskEmailAddresses}.
 *
 * - It runs on attacker-controlled request bodies in the exception filter, so it must stay linear.
 *   The regex starts at the literal `@` (one attempt per `@`) and the local part is walked back in
 *   code, capped at 64 chars. Two earlier designs failed review:
 *   - an unanchored `local{1,64}@…` re-ran the domain match at every position within 64 chars of
 *     an `@` (a 101 KB emoji body cost ~400 ms per request);
 *   - anchoring the local part with a lookbehind leaked addresses after a long `=&|+` run
 *     (`…&utm_campaign=x&email=ross@example.com`) and the second address of `a@x.com&cc=b@y.com`.
 *   Every domain part is capped too (label ≤ 63, ≤ 8 labels, TLD ≤ 63). 100 KB of hostile ASCII,
 *   CJK or emoji input takes a few ms.
 * - Domain labels may start with a digit and hold Unicode letters and combining marks
 *   (`wang@163.com`, `kurt@1und1.de`, `jose@münchen.de`, `.भारत`); the TLD is letters or punycode
 *   (`xn--p1ai`, any case), never digits.
 * - Neither side holds a path separator, and the TLD must not be a file extension (any case, and
 *   not followed by another label), so package paths in stacks (`.pnpm/stripe@17.7.0/…`,
 *   `@aws-sdk/client-s3`, `bullmq@6.7.1_…`) and asset names (`photo@2x.png`, `icon@2x.PNG`,
 *   `photo@2x.min.png`) are not addresses. `.map` is a real TLD, so it is not excluded.
 * - Brackets, braces and backticks are excluded from the local part, so the surrounding delimiter
 *   is kept (`[ross@example.com]` → `[[email]]`).
 */
const EMAIL_DOMAIN_IN_TEXT =
  /@(?:[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}-]{0,62}\.){1,8}(?!(?:[pP][nN][gG]|[jJ][pP][eE]?[gG]|[gG][iI][fF]|[wW][eE][bB][pP]|[aA][vV][iI][fF]|[sS][vV][gG]|[iI][cC][oO]|[jJ][sS]|[mM][jJ][sS]|[cC][jJ][sS]|[tT][sS]|[jJ][sS][oO][nN]|[cC][sS][sS]|[hH][tT][mM][lL]?)(?![\p{L}\p{M}\p{N}-]|\.[\p{L}\p{M}\p{N}]))(?:[\p{L}\p{M}]{2,63}|[xX][nN]--[a-zA-Z0-9-]{1,59})(?![\p{L}\p{M}\p{N}-]|\.[\p{L}\p{M}\p{N}])/gu;

/**
 * Replaces every address-shaped substring with `[email]`. For free text that may quote a recipient
 * or a submitted value (`Invalid to: ross@example.com`); structured fields go through
 * {@link redactLogOptions}.
 */
export function maskEmailAddresses(text: string): string {
  if (typeof text !== 'string' || !text.includes('@')) return text;

  let out = '';
  let last = 0;
  for (const match of text.matchAll(EMAIL_DOMAIN_IN_TEXT)) {
    const at = match.index;
    const start = localPartStart(text, at, last);
    if (start === at) continue; // `@domain.tld` with nothing in front (`@aws-sdk/…`-like): not an address
    out += text.slice(last, start) + '[email]';
    last = at + match[0].length;
  }
  return out + text.slice(last);
}

/** Characters that end a local part when walking back from the `@`. */
const LOCAL_PART_DELIMITER = /[\s@<>"'(),;:/\\[\]{}`]/u;
const MAX_LOCAL_PART_CHARS = 64;

/**
 * Index where the local part in front of `text[at] === '@'` starts: walks back over at most 64
 * code points, stopping at a delimiter or at `floor` (the end of the previous masked address).
 */
function localPartStart(text: string, at: number, floor: number): number {
  let start = at;
  for (let chars = 0; chars < MAX_LOCAL_PART_CHARS && start > floor; chars++) {
    const low = text.charCodeAt(start - 1);
    const isPair =
      low >= 0xdc00 &&
      low <= 0xdfff &&
      start - 2 >= floor &&
      (text.charCodeAt(start - 2) & 0xfc00) === 0xd800;
    const width = isPair ? 2 : 1;
    if (LOCAL_PART_DELIMITER.test(text.slice(start - width, start))) break;
    start -= width;
  }
  return start;
}

/**
 * The request path with every sensitive route param value replaced by `:<name>`, e.g.
 * `/v1/email-preferences/abc123/token` -> `/v1/email-preferences/:token/token`.
 *
 * Fails closed:
 * - `null` until a route is matched (and for unmatched paths): without the template there is
 *   no way to tell which segment is a secret.
 * - the route template itself when a sensitive param's value is missing or not a plain string
 *   (wildcards), or would still appear in the result.
 */
export function redactRoutePath(
  path: string,
  route: string | null | undefined,
  params: Record<string, unknown> | null | undefined,
): string | null {
  if (!route) return null;
  const sensitive = [...route.matchAll(/[:*](\w+)/g)]
    .map((match) => match[1])
    .filter(isSensitivePathParam);
  if (!sensitive.length) return path;

  const nameByValue = new Map<string, string>();
  for (const name of sensitive) {
    const value = params?.[name];
    if (typeof value !== 'string' || !value) return route;
    nameByValue.set(value, name);
  }

  const masked = path
    .split('/')
    .map((segment) => {
      const name = nameByValue.get(segment) ?? nameByValue.get(safeDecode(segment));
      return name ? `:${name}` : segment;
    })
    .join('/');
  const leaks = [...nameByValue.keys()].some(
    (value) => masked.includes(value) || masked.includes(encodeURIComponent(value)),
  );
  return leaks ? route : masked;
}

function isEmailKey(key: string): boolean {
  return normalizeKey(key).includes(EMAIL_KEY_SUBSTRING);
}

/**
 * Whether a value under an email-ish key is actually an address.
 *
 * `email_type`, `emailTemplate` and friends match {@link isEmailKey} but hold enum/template
 * names, not PII. Masking those unconditionally turned every mail log line into
 * `"email_type":"[redacted]"`, so the value has to earn the masking. Loose on purpose — it
 * only decides *whether* to mask; {@link maskEmail} still owns the output shape, and an
 * already-masked `ab***@host.com` matches so masking stays idempotent.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(value);
}

/** Masks only address-shaped strings; anything else under an email-ish key is left intact. */
function maskIfEmail(value: string): string {
  return looksLikeEmail(value) ? maskEmail(value) : value;
}

/**
 * Partially masks an email so logs stay traceable without storing the full address.
 * Returns `[redacted]` when the input is not a parseable address.
 */
export function maskEmail(email: string): string {
  if (typeof email !== 'string') {
    return '[redacted]';
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return '[redacted]';
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

/** Only plain objects are traversed; class instances (Date, Buffer, …) are passed through as-is. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-clones `value`, replacing secrets with {@link REDACTED} and masking emails.
 *
 * Applied at the two points in LogService that consume the caller's options object
 * (serialization and the error-alert callback), so every driver and every call site is
 * covered without each one having to remember to sanitize.
 *
 * Cycle-safe by design: the raw payloads here include Stripe events and Express requests,
 * and a cycle used to make `JSON.stringify` throw inside the log writer — silently
 * discarding the whole line.
 */
export function redactLogOptions<T>(value: T): T {
  return redactValue(value, 0, new WeakSet<object>()) as T;
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value as object)) {
    return CIRCULAR;
  }

  if (depth >= MAX_DEPTH) {
    return MAX_DEPTH_MARKER;
  }

  if (Array.isArray(value)) {
    seen.add(value);
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactValue(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`);
    }
    seen.delete(value);
    return items;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  seen.add(value);
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
    } else if (isEmailKey(key) && typeof entry === 'string') {
      result[key] = maskIfEmail(entry);
    } else if (isEmailKey(key) && Array.isArray(entry)) {
      // `emails: [...]` batch payloads. maskEmail is idempotent, so call sites that already
      // masked their own list are unaffected.
      result[key] = entry.map((item) =>
        typeof item === 'string' ? maskIfEmail(item) : redactValue(item, depth + 1, seen),
      );
    } else {
      result[key] = redactValue(entry, depth + 1, seen);
    }
  }
  seen.delete(value);
  return result;
}
