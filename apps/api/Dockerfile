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

# Mount Turbo's task cache so unchanged packages are restored instead of recompiled.
RUN --mount=type=cache,id=turbo-cache,target=/root/.cache/turbo \
    pnpm turbo run build --filter=@repo/api...

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

WORKDIR /workspace

# IMPORTANT: copy only manifests first, then install. Keeping the prod install
# above the dist COPYs means the (slow) install layer stays cached on code-only
# changes — it is re-run solely when a package.json / lockfile / patch changes.
COPY --from=builder /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=builder /workspace/packages/common-lib/package.json ./packages/common-lib/package.json
COPY --from=builder /workspace/packages/backend-lib/package.json ./packages/backend-lib/package.json
COPY --from=builder /workspace/packages/database/package.json ./packages/database/package.json
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /workspace/patches ./patches

# Install production dependencies only (cached unless dependencies change).
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    corepack enable && corepack prepare pnpm@11.6.0 --activate && \
    pnpm install --frozen-lockfile --prod

# Built artifacts change on every code edit, so copy them AFTER the install layer.
COPY --from=builder /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder /workspace/packages/common-lib/dist ./packages/common-lib/dist
COPY --from=builder /workspace/packages/backend-lib/dist ./packages/backend-lib/dist
COPY --from=builder /workspace/packages/database/dist ./packages/database/dist

EXPOSE 8080

CMD ["node", "apps/api/dist/main"]
