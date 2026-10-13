/**
 * Cookie-consent storage (GDPR / LSSI: opt-in, nothing optional runs before a choice).
 *
 * The choices live in ONE first-party cookie, `a11_consent`, as `v1:<category>=1|0` pairs joined
 * by commas (e.g. `v1:analytics=1,marketing=0`). A cookie (not localStorage) so the server can read
 * it later without a migration.
 *
 * ADDING A COOKIE CATEGORY: add its name to {@link CONSENT_CATEGORIES}, add its copy to the banner,
 * and gate the code with `useConsent().has("<category>")` (or {@link hasConsent} outside React).
 * Visitors who never decided on the new category are asked again; existing choices are kept.
 * Bump {@link CONSENT_VERSION} only to force EVERYONE to choose again.
 *
 * Browser-only: every function is a safe no-op during SSR.
 */
import { readCookie, writeRawCookie } from "./cookie";

/** Every optional-cookie category the site can ask about. Strictly necessary cookies are not listed. */
export const CONSENT_CATEGORIES = ["analytics"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

/** `true` = accepted, `false` = rejected, missing = never decided. */
export type ConsentChoices = Partial<Record<ConsentCategory, boolean>>;

export const CONSENT_COOKIE = "a11_consent";
const CONSENT_VERSION = "v1";
/** 12 months. The AEPD guidance caps consent validity at 24 months. */
const CONSENT_MAX_AGE_S = 60 * 60 * 24 * 365;

const CONSENT_CHANGE_EVENT = "a11:consent-change";

const isCategory = (value: string): value is ConsentCategory =>
  (CONSENT_CATEGORIES as readonly string[]).includes(value);

/** Parses the stored value. Unknown categories, a wrong version or garbage yield `{}` (ask again). */
export const parseConsent = (raw: string | null): ConsentChoices => {
  if (!raw) return {};
  const prefix = `${CONSENT_VERSION}:`;
  if (!raw.startsWith(prefix)) return {};
  const choices: ConsentChoices = {};
  for (const pair of raw.slice(prefix.length).split(",")) {
    const [name, value] = pair.split("=");
    if (name && isCategory(name) && (value === "1" || value === "0")) {
      choices[name] = value === "1";
    }
  }
  return choices;
};

export const serializeConsent = (choices: ConsentChoices): string =>
  `${CONSENT_VERSION}:${CONSENT_CATEGORIES.filter(
    (category) => choices[category] !== undefined,
  )
    .map((category) => `${category}=${choices[category] ? 1 : 0}`)
    .join(",")}`;

/** Raw cookie value (`""` when absent). A primitive, so it is a stable `useSyncExternalStore` snapshot. */
export const readRawConsent = (): string => readCookie(CONSENT_COOKIE) ?? "";

export const readConsentChoices = (): ConsentChoices =>
  parseConsent(readRawConsent());

/** For non-React callers (e.g. `trackEvent`): has the visitor accepted this category? */
export const hasConsent = (category: ConsentCategory): boolean =>
  readConsentChoices()[category] === true;

/** Merges `update` into the stored choices (other categories are untouched) and notifies listeners. */
export const writeConsent = (update: ConsentChoices) => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = encodeURIComponent(
    serializeConsent({ ...readConsentChoices(), ...update }),
  );
  writeRawCookie(
    `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_S}; Path=/; SameSite=Lax${secure}`,
  );
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
};

export const subscribeConsent = (onChange: () => void) => {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  // Another tab changing the choice.
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
};
