/**
 * Try/catch wrappers for local/session storage. Both can throw (private mode, blocked site data)
 * or be empty, so callers treat a miss as "no preference" and must work without them.
 * Only for per-browser UI conveniences, never for state that has to persist.
 */
type StorageKind = "local" | "session";

const getStore = (kind: StorageKind): Storage | null => {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

export const readStorage = (kind: StorageKind, key: string): string | null => {
  try {
    return getStore(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const writeStorage = (kind: StorageKind, key: string, value: string) => {
  try {
    getStore(kind)?.setItem(key, value);
  } catch {
    // Storage unavailable: the preference just isn't remembered.
  }
};
