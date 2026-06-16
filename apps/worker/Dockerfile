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
  && corepack prepare pnpm@10.32.1 --activate

# Dependency layer: invalidated only when the lockfile changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

COPY package.json turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline
RUN pnpm turbo run build --filter=@repo/worker...

# Prune to production-only node_modules
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm deploy --legacy --filter=@repo/worker --prod /prod/worker

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /workspace

# Copy pruned production node_modules for the worker app
COPY --from=builder /prod/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /prod/worker/package.json ./apps/worker/package.json

# Copy compiled output for the worker and all workspace packages it depends on
COPY --from=builder /workspace/apps/worker/dist ./apps/worker/dist

COPY --from=builder /workspace/packages/common-lib/dist ./packages/common-lib/dist
COPY --from=builder /workspace/packages/common-lib/package.json ./packages/common-lib/package.json

COPY --from=builder /workspace/packages/backend-lib/dist ./packages/backend-lib/dist
COPY --from=builder /workspace/packages/backend-lib/package.json ./packages/backend-lib/package.json

COPY --from=builder /workspace/packages/database/dist ./packages/database/dist
COPY --from=builder /workspace/packages/database/package.json ./packages/database/package.json

# Root package.json is needed so Node can resolve workspace: links
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 8081

CMD ["node", "apps/worker/dist/main.js"]
