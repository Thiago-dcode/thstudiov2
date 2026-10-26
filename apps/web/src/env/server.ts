import "server-only";

/**
 * Server-only env, read from the running process (container env in production).
 *
 * Every value is a getter, so it is read from `process.env` when it is used, never at import time
 * and never during `next build`. A required value that is missing throws in the request that needs
 * it. During the build phase, missing values read as empty so module-level code does not fail the
 * build. Nothing here is validated by a schema library.
 */

export interface ServerEnv {
  ENCRYPTION_SECRET: string;
  APP_API_KEY: string;
  APP_TOKEN: string;
  APP_URL: string;
  API_V1_URL: string;
  SUPPORT_EMAIL: string;
  SUPPORT_USERNAME: string;
  REGISTRATION_IS_CLOSED: number;
  LEGAL_OWNER_NAME?: string;
  LEGAL_TAX_ID?: string;
  LEGAL_ADDRESS?: string;
  LEGAL_REGISTRY?: string;
  /** 1 = show the cookie banner under `next dev`. Never loads GA; ignored outside development. */
  CONSENT_PREVIEW: number;
}

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

/** A required value: trimmed, and an unset or blank one throws at runtime. */
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isBuildPhase()) return "";
  throw new Error(`Missing server environment variable: ${name}`);
}

/** An optional value: unset or blank reads as undefined. */
function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** A whole-number flag: unset, blank or not a whole number falls back to `fallback`. */
function integer(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export const serverEnv: ServerEnv = {
  get ENCRYPTION_SECRET() {
    return required("ENCRYPTION_SECRET");
  },
  get APP_API_KEY() {
    return required("APP_API_KEY");
  },
  get APP_TOKEN() {
    return required("APP_TOKEN");
  },
  get APP_URL() {
    return required("APP_URL");
  },
  get API_V1_URL() {
    return required("API_V1_URL");
  },
  get SUPPORT_EMAIL() {
    return required("SUPPORT_EMAIL");
  },
  get SUPPORT_USERNAME() {
    return required("SUPPORT_USERNAME");
  },
  get REGISTRATION_IS_CLOSED() {
    return integer("REGISTRATION_IS_CLOSED", 0);
  },
  // Legal notice (LSSI art. 10, /legal/notice): optional so a missing value never breaks a request,
  // but production must set the first three. The page warns while they are unset.
  get LEGAL_OWNER_NAME() {
    return optional("LEGAL_OWNER_NAME");
  },
  get LEGAL_TAX_ID() {
    return optional("LEGAL_TAX_ID");
  },
  get LEGAL_ADDRESS() {
    return optional("LEGAL_ADDRESS");
  },
  get LEGAL_REGISTRY() {
    return optional("LEGAL_REGISTRY");
  },
  get CONSENT_PREVIEW() {
    return integer("CONSENT_PREVIEW", 0);
  },
};

/** The same object as `serverEnv`, kept so existing `getServerEnv()` callers keep working. */
export function getServerEnv(): ServerEnv {
  return serverEnv;
}
