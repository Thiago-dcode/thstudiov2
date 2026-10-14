import "server-only";
import * as z from "zod";

/** An unset GitHub secret reaches the build as an empty string: treat it as missing. */
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const serverEnvSchema = z.object({
  ENCRYPTION_SECRET: z.string().min(1),
  APP_API_KEY: z.string().min(1),
  APP_TOKEN: z.string().min(1),
  // Must parse as a URL: `isIndexableEnv()` compares its host against the canonical production
  // host, and an unparseable value there means "not indexable" — better to fail loudly at boot.
  APP_URL: z.url(),
  API_V1_URL: z.string().min(1),
  GEOAPIFY_URL: z.string().min(1),
  GEOAPIFY_KEY: z.string().min(1),
  SUPPORT_EMAIL: z.email(),
  SUPPORT_USERNAME: z.string().min(1),
  REGISTRATION_IS_CLOSED: z.coerce.number().int().min(0).default(0),
  // Legal notice (LSSI art. 10, /legal/notice): who runs the site. Optional so a missing value
  // never breaks a deploy, but production must set the first three — the page warns while unset.
  LEGAL_OWNER_NAME: optionalText,
  LEGAL_TAX_ID: optionalText,
  LEGAL_ADDRESS: optionalText,
  LEGAL_REGISTRY: optionalText,
  // 1 = show the cookie banner under `next dev` to work on it. Never loads GA, ignored outside
  // development. See `lib/consent/active-categories.ts`.
  CONSENT_PREVIEW: z.coerce.number().int().min(0).default(0),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseServerEnv(): ServerEnv | null {
  const parsed = serverEnvSchema.safeParse(process.env);
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (!parsed.success) {
    console.error(
      "Invalid server environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    if (!isBuildPhase) {
      throw new Error(
        "Invalid server environment variables. Check the console for details.",
      );
    }
    return null;
  }

  return parsed.data;
}

/** Read server env at call time so runtime container env wins over build-time snapshots. */
export function getServerEnv(): ServerEnv {
  const env = parseServerEnv();
  if (env) return env;

  // Turbopack build workers may not inherit build-time env vars (see server.ts header).
  // Defer hard failures to request time — same as the pre-proxy serverEnv export.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {} as ServerEnv;
  }

  throw new Error(
    "Invalid server environment variables. Check the console for details.",
  );
}

/** Lazy proxy — each property read uses the current process.env (Docker runtime). */
export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});
