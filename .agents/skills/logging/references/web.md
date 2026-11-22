# Logging in apps/web (server side only)

Read when logging from a server action, Route Handler or Server Component.

Log through `@/lib/logging/logger` (`server-only`), never `logService` directly and never from a Client Component. Lines go to the Redis buffer with `service: "web"`, `channel: "web"`; the worker writes `storage/logs/web/<date>.log`. Web never flushes.

- `webLogger` is shared across requests: pass the flow as `operation` in the call's options (`webLogger.warn('OAuth callback rejected', { reason, operation: 'oauth-callback' })`).
- Wrap the body in `withLogTrace(fn, context)` so its lines share one trace `id` and `request`. The context is required: `{ kind: 'action' }` for a server action, or `{ kind: 'route', method, route }` where `route` is the **route pattern as written in the app dir** (`/api/oauth2/[provider]/callback`), never the requested URL, query string, header or cookie. Outside `withLogTrace` a line has `id: ''` and no `request`.
- `critical` from web mails the admins like api/worker (the factory's `emailCritical` callback enqueues on Redis for the api's mail processor). `bullmq` and `ioredis` are web deps and in `serverExternalPackages`.
- Direct-write fallback folder: `LOG_STORAGE_DIR`, else `<cwd>/../../storage/logs`.
- `redact.ts` redacts any key containing a sensitive word (e.g. `invitationcode`), even for a boolean. Use names like `invited`.
- Web lines reach Loki only once the server's Alloy scrape includes `storage/logs/web/*.log`.
- Reference: `apps/web/src/modules/auth/server-actions/Oauth2Initiate.action.ts`.
