"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type ConsentCategory,
  type ConsentChoices,
  parseConsent,
  readRawConsent,
  subscribeConsent,
  writeConsent,
} from "@/lib/consent/consent";

/** Server / first-hydration snapshot. Not a valid cookie value, so it can never collide with one. */
const PENDING = "\u0000pending";

type ConsentContextValue = {
  /** `false` on the server and during hydration; the cookie has not been read yet. */
  ready: boolean;
  /** Categories this deployment actually uses (the rest are never asked about nor granted). */
  categories: readonly ConsentCategory[];
  /** Stored choices. Missing key = undecided. */
  choices: ConsentChoices;
  /** Has the visitor accepted this category? `false` until `ready`, and for inactive categories. */
  has: (category: ConsentCategory) => boolean;
  /** At least one active category has no stored choice yet. */
  needsDecision: boolean;
  /** The footer "Cookie settings" link asked to reopen the banner. */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  /** Persist choices for some categories (others untouched) and close the settings. */
  setConsent: (choices: ConsentChoices) => void;
  acceptAll: () => void;
  rejectAll: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

/**
 * Single source of truth for cookie consent. Wrap the whole app once; read it anywhere below with
 * {@link useConsent}.
 *
 * `categories` is decided by the server (e.g. `["analytics"]` only on production with a GA ID).
 * A category that is not listed behaves as "off": `has()` is `false`, nothing asks about it.
 */
export const ConsentProvider = ({
  categories,
  children,
}: {
  categories: readonly ConsentCategory[];
  children: ReactNode;
}) => {
  const raw = useSyncExternalStore(
    subscribeConsent,
    readRawConsent,
    () => PENDING,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const ready = raw !== PENDING;
  const choices = useMemo(() => (ready ? parseConsent(raw) : {}), [raw, ready]);

  const has = useCallback(
    (category: ConsentCategory) =>
      ready && categories.includes(category) && choices[category] === true,
    [ready, categories, choices],
  );

  const needsDecision =
    ready && categories.some((category) => choices[category] === undefined);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const setConsent = useCallback((update: ConsentChoices) => {
    writeConsent(update);
    setSettingsOpen(false);
  }, []);

  const decideAll = useCallback(
    (value: boolean) =>
      setConsent(
        Object.fromEntries(
          categories.map((category) => [category, value]),
        ) as ConsentChoices,
      ),
    [categories, setConsent],
  );
  const acceptAll = useCallback(() => decideAll(true), [decideAll]);
  const rejectAll = useCallback(() => decideAll(false), [decideAll]);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ready,
      categories,
      choices,
      has,
      needsDecision,
      settingsOpen,
      openSettings,
      closeSettings,
      setConsent,
      acceptAll,
      rejectAll,
    }),
    [
      ready,
      categories,
      choices,
      has,
      needsDecision,
      settingsOpen,
      openSettings,
      closeSettings,
      setConsent,
      acceptAll,
      rejectAll,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextValue => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};
