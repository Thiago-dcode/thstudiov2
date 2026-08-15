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
 * Keys redacted only on an exact normalized match. `code` in particular must NOT be a
 * substring rule — `status_code`, `country_code`, `language_code` and `api_error_code`
 * are the fields that make an error log worth reading.
 */
const SENSITIVE_KEYS_EXACT = new Set([
  'code',
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

function isEmailKey(key: string): boolean {
  return normalizeKey(key).includes(EMAIL_KEY_SUBSTRING);
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
      result[key] = maskEmail(entry);
    } else if (isEmailKey(key) && Array.isArray(entry)) {
      // `emails: [...]` batch payloads. maskEmail is idempotent, so call sites that already
      // masked their own list are unaffected.
      result[key] = entry.map((item) =>
        typeof item === 'string' ? maskEmail(item) : redactValue(item, depth + 1, seen),
      );
    } else {
      result[key] = redactValue(entry, depth + 1, seen);
    }
  }
  seen.delete(value);
  return result;
}
