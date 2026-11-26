"use client";

import {
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_TOKEN_FIELD,
  type TurnstileAction,
} from "@repo/common-lib/constants/turnstile";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

/** The subset of Cloudflare's `window.turnstile` API this widget uses (explicit rendering). */
type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  theme: "light" | "dark" | "auto";
  size: "flexible" | "normal" | "compact";
  appearance: "always" | "execute" | "interaction-only";
  language: string;
  "response-field": boolean;
  "refresh-expired": "auto" | "manual" | "never";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: TurnstileRenderOptions,
      ) => string | null | undefined;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * Cloudflare's fixed height for a `flexible` widget. Reserved before the script loads so the form
 * does not shift when the widget appears. Not a design value.
 */
const TURNSTILE_WIDGET_HEIGHT_PX = 65;

/** Page locale → Turnstile `language`. Unknown locales fall back to Cloudflare's auto-detect. */
const TURNSTILE_LANGUAGES: Record<string, string> = {
  en: "en",
  es: "es",
  pt: "pt-br",
};

export type TurnstileWidgetHandle = {
  /** Discards the current token and asks Cloudflare for a fresh one. */
  reset(): void;
};

/** The `<html>` `.dark` class at render time; Turnstile can't follow a later toggle. */
function currentTheme(): TurnstileRenderOptions["theme"] {
  if (typeof document === "undefined") return "auto";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Cloudflare Turnstile bot check. Rendered in the browser on every mount (explicit render), so a
 * cached HTML response never carries a token. The token is posted as `turnstile_token` through a
 * hidden input; the api verifies it with Siteverify.
 */
export const TurnstileWidget = ({
  siteKey,
  action,
  onTokenChange,
  statusId,
  ref,
}: {
  siteKey: string;
  action: TurnstileAction;
  onTokenChange: (token: string | null) => void;
  /** Id of the status line, so a disabled submit can point at it with `aria-describedby`. */
  statusId?: string;
  ref?: Ref<TurnstileWidgetHandle>;
}) => {
  const t = useTranslations("turnstile");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // The parent's callback goes through a ref so a new one never removes and re-renders the widget.
  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  const updateToken = useCallback((value: string | null) => {
    setToken(value);
    onTokenChangeRef.current(value);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!scriptReady || !container || !turnstile) return;

    const widgetId = turnstile.render(container, {
      sitekey: siteKey,
      action,
      theme: currentTheme(),
      size: "flexible",
      appearance: "always",
      language: TURNSTILE_LANGUAGES[locale] ?? "auto",
      "response-field": false,
      "refresh-expired": "auto",
      callback: (value) => {
        setLoadError(false);
        updateToken(value);
      },
      "expired-callback": () => updateToken(null),
      "error-callback": () => {
        setLoadError(true);
        updateToken(null);
      },
      "timeout-callback": () => updateToken(null),
    });
    widgetIdRef.current = widgetId ?? null;

    return () => {
      if (widgetId) window.turnstile?.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, [scriptReady, siteKey, action, locale, updateToken]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        updateToken(null);
      },
    }),
    [updateToken],
  );

  return (
    <div role="group" aria-label={t("label")} className="flex flex-col gap-2">
      <Script
        src={`${TURNSTILE_SCRIPT_URL}?render=explicit`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setLoadError(true)}
      />
      <div
        ref={containerRef}
        className="w-full"
        style={{ minHeight: TURNSTILE_WIDGET_HEIGHT_PX }}
      />
      <input type="hidden" name={TURNSTILE_TOKEN_FIELD} value={token ?? ""} />
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        // Two pinned lines: es/pt "pending" wraps on 320–360 px, and the line must not
        // collapse when it clears, or the submit button jumps.
        className="min-h-10 text-xs! leading-5! text-text-muted"
      >
        {loadError ? t("loadError") : token ? "" : t("pending")}
      </p>
    </div>
  );
};
