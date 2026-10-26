# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
# Suppress telemetry HTTP calls during the build — speeds up both turbo and next.
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@12.15.0

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
ARG NEXT_PUBLIC_GA_ID

# CDN host must be present at build time: next.config.ts bakes it into next/image
# remotePatterns, and the client bundle inlines it. A runtime-only value would leave CDN
# images rejected by the optimizer.
ARG NEXT_PUBLIC_CDN_URL

# Promote non-secret args to ENV so they are visible during `next build`.
# NEXT_PUBLIC_* are inlined into the client bundle by design and are therefore public
# by definition (keep NEXT_PUBLIC_GEOAPIFY_KEY domain-restricted at the provider).
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_GEOAPIFY_URL=$NEXT_PUBLIC_GEOAPIFY_URL
ENV NEXT_PUBLIC_GEOAPIFY_KEY=$NEXT_PUBLIC_GEOAPIFY_KEY
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL

# Mount both the Turbo task cache and the Next.js incremental cache so unchanged
# packages are not recompiled and Turbopack can reuse prior compilation artifacts.
# On a cold build this has no effect; on subsequent builds with unchanged source
# files it can cut compile time from 20+ min to a few minutes.
#
# The build has no secrets. Server-side config (APP_URL, API keys, ...) is read from the
# container's environment at runtime, so it never reaches a layer or the build cache.
RUN --mount=type=cache,id=turbo-cache,target=/root/.cache/turbo \
    --mount=type=cache,id=nextjs-cache-dev,target=/workspace/apps/web/.next/cache \
    pnpm turbo run build --filter=@repo/web...

# Ensure public/ exists so the runner COPY succeeds even if the project has no static assets.
RUN mkdir -p /workspace/apps/web/public

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner

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
