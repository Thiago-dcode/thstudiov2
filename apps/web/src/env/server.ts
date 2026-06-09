import 'server-only';
import * as z from 'zod';

const serverEnvSchema = z.object({
    ENCRYPTION_SECRET: z.string().min(1),
    APP_API_KEY: z.string().min(1),
    APP_URL: z.string().min(1),
    API_V1_URL: z.string().min(1),
    ASSETS_URL: z.string().min(1),
    GEOAPIFY_URL: z.string().min(1),
    GEOAPIFY_KEY: z.string().min(1),
    SUPPORT_EMAIL: z.email().default('support@a11studio.com'),
    SUPPORT_USERNAME: z.string().min(1).default('a11studio_support'),
    REGISTRATION_IS_CLOSED: z.coerce.number().int().min(0).default(0),
});

const parsed = serverEnvSchema.safeParse(process.env);

// During `next build`, Turbopack worker processes collect page data in an isolated
// context that does not inherit build-time env vars. Throwing here would abort the
// build even for fully-dynamic routes that never use these values at build time.
// We defer the hard throw to request time so the build always succeeds; any truly
// missing var will surface the moment a real request tries to use it.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

if (!parsed.success) {
    console.error('Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    if (!isBuildPhase) {
        throw new Error('Invalid server environment variables. Check the console for details.');
    }
}

export const serverEnv = (parsed.success ? parsed.data : {}) as z.infer<typeof serverEnvSchema>;
