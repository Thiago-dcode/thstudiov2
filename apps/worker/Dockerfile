# ─── Stage 1: builder ────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV CI=true

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
RUN pnpm turbo run build --filter=@repo/worker...

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

WORKDIR /workspace

# Copy worker app
COPY --from=builder /workspace/apps/worker/dist ./apps/worker/dist
COPY --from=builder /workspace/apps/worker/package.json ./apps/worker/package.json

# Copy workspace packages
COPY --from=builder /workspace/packages/common-lib/dist ./packages/common-lib/dist
COPY --from=builder /workspace/packages/common-lib/package.json ./packages/common-lib/package.json

COPY --from=builder /workspace/packages/backend-lib/dist ./packages/backend-lib/dist
COPY --from=builder /workspace/packages/backend-lib/package.json ./packages/backend-lib/package.json

COPY --from=builder /workspace/packages/database/dist ./packages/database/dist
COPY --from=builder /workspace/packages/database/package.json ./packages/database/package.json

# Root manifests needed so pnpm can resolve workspace: links
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /workspace/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate && \
    pnpm install --frozen-lockfile --prod

EXPOSE 8081

CMD ["node", "apps/worker/dist/main.js"]
