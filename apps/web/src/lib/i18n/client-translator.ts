import type { Translator } from "@/lib/validation/zod-helpers";

let translator: Translator | null = null;

/**
 * Registers the active `useTranslations()` translator for modules that need translated
 * messages but cannot call a hook — schema factories and validators reached from plain
 * functions whose signatures are fixed (see `modules/media/api/media-api.client.ts`).
 *
 * Guarded on `window` because a `"use client"` module is still *evaluated* on the server
 * during SSR, where this module-level state is shared by every concurrent request — one
 * visitor's locale could otherwise leak into another's render.
 */
export const setClientTranslator = (t: Translator) => {
  if (typeof window === "undefined") return;
  translator = t;
};

/**
 * Null until a client component has registered one. Callers must treat that as "no
 * translated message available" and degrade — never fall back to an English literal,
 * which would be worse than the caller's own generic-error path.
 */
export const clientTranslator = (): Translator | null => translator;
