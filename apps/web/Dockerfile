# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV CI=true
# Suppress telemetry HTTP calls during the build — speeds up both turbo and next.
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.6.0 --activate

# Dependency layer: invalidated only when the lockfile or patches change.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

COPY package.json turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

# Public (client-bundle) vars
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_GEOAPIFY_URL
ARG NEXT_PUBLIC_GEOAPIFY_KEY

# Server-only vars required by serverEnv Zod validation at static generation time.
#
# NOTE: APP_API_KEY, APP_TOKEN, ENCRYPTION_SECRET and GEOAPIFY_KEY are deliberately
# NOT ARGs — see the secret mounts on the build step below.
ARG APP_URL
ARG API_V1_URL
ARG GEOAPIFY_URL
ARG SUPPORT_EMAIL
ARG SUPPORT_USERNAME
ARG REGISTRATION_IS_CLOSED
# CDN host must be present at build time: next.config.ts bakes it into next/image
# remotePatterns. Runtime-only CDN_URL would leave CDN images rejected by the optimizer.
ARG CDN_URL

# Promote non-secret args to ENV so they are visible during `next build`.
# NEXT_PUBLIC_* are inlined into the client bundle by design and are therefore public
# by definition (keep NEXT_PUBLIC_GEOAPIFY_KEY domain-restricted at the provider).
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_GEOAPIFY_URL=$NEXT_PUBLIC_GEOAPIFY_URL
ENV NEXT_PUBLIC_GEOAPIFY_KEY=$NEXT_PUBLIC_GEOAPIFY_KEY
ENV APP_URL=$APP_URL
ENV API_V1_URL=$API_V1_URL
ENV GEOAPIFY_URL=$GEOAPIFY_URL
ENV SUPPORT_EMAIL=$SUPPORT_EMAIL
ENV SUPPORT_USERNAME=$SUPPORT_USERNAME
ENV REGISTRATION_IS_CLOSED=$REGISTRATION_IS_CLOSED
ENV CDN_URL=$CDN_URL

# Mount both the Turbo task cache and the Next.js incremental cache so unchanged
# packages are not recompiled and Turbopack can reuse prior compilation artifacts.
# On a cold build this has no effect; on subsequent builds with unchanged source
# files it can cut compile time from 20+ min to a few minutes.
#
# Secrets are mounted rather than passed as build args. An ARG promoted to ENV is
# written into the image's layer metadata, and CI exports every stage — builder
# included — to the shared GitHub Actions cache via `cache-to: mode=max`. That made
# these values recoverable from the cache. A secret mount exists only for the
# lifetime of this RUN and never lands in a layer or the cache.
RUN --mount=type=cache,id=turbo-cache,target=/root/.cache/turbo \
    --mount=type=cache,id=nextjs-cache-dev,target=/workspace/apps/web/.next/cache \
    --mount=type=secret,id=app_api_key \
    --mount=type=secret,id=app_token \
    --mount=type=secret,id=encryption_secret \
    --mount=type=secret,id=geoapify_key \
    APP_API_KEY="$(cat /run/secrets/app_api_key)" \
    APP_TOKEN="$(cat /run/secrets/app_token)" \
    ENCRYPTION_SECRET="$(cat /run/secrets/encryption_secret)" \
    GEOAPIFY_KEY="$(cat /run/secrets/geoapify_key)" \
    pnpm turbo run build --filter=@repo/web...

# Ensure public/ exists so the runner COPY succeeds even if the project has no static assets.
RUN mkdir -p /workspace/apps/web/public

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /workspace/apps/web

# Next.js standalone output is self-contained: it bundles its own node_modules
# and a minimal server. We only need to add the static assets on top.
COPY --from=builder /workspace/apps/web/.next/standalone ./
COPY --from=builder /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /workspace/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Drop root. Unlike the api/worker images this one does need a writable path:
# Next.js writes ISR/revalidation output under .next/cache at runtime, so that
# directory (and only that directory) is handed to uid 1000.
RUN mkdir -p apps/web/.next/cache && chown -R node:node apps/web/.next/cache

USER node

CMD ["node", "apps/web/server.js"]
