import "server-only";
import * as z from "zod";

const serverEnvSchema = z.object({
  ENCRYPTION_SECRET: z.string().min(1),
  APP_API_KEY: z.string().min(1),
  APP_URL: z.string().min(1),
  API_V1_URL: z.string().min(1),
  ASSETS_URL: z.string().min(1),
  GEOAPIFY_URL: z.string().min(1),
  GEOAPIFY_KEY: z.string().min(1),
  SUPPORT_EMAIL: z.email().default("support@a11studio.com"),
  SUPPORT_USERNAME: z.string().min(1).default("a11studio_support"),
  REGISTRATION_IS_CLOSED: z.coerce.number().int().min(0).default(0),
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
  if (!env) {
    throw new Error(
      "Invalid server environment variables. Check the console for details.",
    );
  }
  return env;
}

/** Lazy proxy — each property read uses the current process.env (Docker runtime). */
export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});
