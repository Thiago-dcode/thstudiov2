/**
 * Minimal first-party cookie helpers. Browser-only: every function is a safe no-op during SSR.
 * The ONLY place in the web app that touches `document.cookie`.
 */

export const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        // Hand-edited / corrupted value: treat as "not set" instead of crashing the render
        // (this can run inside a useSyncExternalStore snapshot, where a throw takes the app down).
        return null;
      }
    }
  }
  return null;
};

export const listCookieNames = (): string[] => {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split("; ")
    .map((part) => part.split("=")[0])
    .filter(Boolean);
};

/** Raw `document.cookie` assignment (full cookie string, attributes included). */
export const writeRawCookie = (cookie: string) => {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not available in Safari/Firefox, and this must work everywhere consent is asked.
  document.cookie = cookie;
};

/** Every parent domain of the current host, e.g. `a.b.com` -> `a.b.com`, `b.com`. */
export const cookieDomains = (): string[] => {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length < 2 || /^\d+(\.\d+){3}$/.test(host)) return [host];
  const domains: string[] = [];
  for (let i = 0; i <= parts.length - 2; i++)
    domains.push(parts.slice(i).join("."));
  return domains;
};

/**
 * Expires cookies by name on the host and on every parent domain (third-party scripts often write
 * on the registrable domain, so host-only deletion is not enough).
 */
export const deleteCookies = (names: string[]) => {
  if (typeof document === "undefined") return;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  for (const name of names) {
    writeRawCookie(`${name}=; ${expired}`);
    for (const domain of cookieDomains()) {
      writeRawCookie(`${name}=; ${expired}; domain=${domain}`);
      writeRawCookie(`${name}=; ${expired}; domain=.${domain}`);
    }
  }
};
