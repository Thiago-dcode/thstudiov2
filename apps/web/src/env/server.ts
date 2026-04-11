import 'server-only';
import * as z from 'zod';

const serverEnvSchema = z.object({
    ENCRYPTION_SECRET: z.string().min(1),
    APP_API_KEY: z.string().min(1),
    APP_URL: z.string().min(1),
    API_V1_URL: z.string().min(1),
    GEOAPIFY_URL: z.string().min(1),
    GEOAPIFY_KEY: z.string().min(1),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables. Check the console for details.');
}

export const serverEnv = parsed.data;
