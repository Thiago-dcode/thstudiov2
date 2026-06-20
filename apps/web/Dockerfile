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
ARG NEXT_PUBLIC_GEOAPIFY_URL
ARG NEXT_PUBLIC_GEOAPIFY_KEY

# Server-only vars required by serverEnv Zod validation at static generation time
ARG APP_URL
ARG APP_API_KEY
ARG API_V1_URL
ARG ASSETS_URL
ARG GEOAPIFY_URL
ARG GEOAPIFY_KEY
ARG ENCRYPTION_SECRET
ARG SUPPORT_EMAIL
ARG SUPPORT_USERNAME
ARG REGISTRATION_IS_CLOSED

# Promote all args to ENV so they are visible during `next build`
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GEOAPIFY_URL=$NEXT_PUBLIC_GEOAPIFY_URL
ENV NEXT_PUBLIC_GEOAPIFY_KEY=$NEXT_PUBLIC_GEOAPIFY_KEY
ENV APP_URL=$APP_URL
ENV APP_API_KEY=$APP_API_KEY
ENV API_V1_URL=$API_V1_URL
ENV ASSETS_URL=$ASSETS_URL
ENV GEOAPIFY_URL=$GEOAPIFY_URL
ENV GEOAPIFY_KEY=$GEOAPIFY_KEY
ENV ENCRYPTION_SECRET=$ENCRYPTION_SECRET
ENV SUPPORT_EMAIL=$SUPPORT_EMAIL
ENV SUPPORT_USERNAME=$SUPPORT_USERNAME
ENV REGISTRATION_IS_CLOSED=$REGISTRATION_IS_CLOSED

# Mount the Next.js incremental cache so Turbopack can reuse prior compilation
# artifacts. On a cold build this has no effect; on subsequent builds with
# unchanged source files it can cut compile time from 20+ min to a few minutes.
RUN --mount=type=cache,id=nextjs-cache-dev,target=/workspace/apps/web/.next/cache \
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

CMD ["node", "apps/web/server.js"]
