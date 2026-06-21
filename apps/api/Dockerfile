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

# Produce a self-contained production bundle: dist + a pruned, fully-resolved
# node_modules (workspace deps hard-linked in, dev deps excluded). This replaces
# the slow second `pnpm install --prod` that previously ran in the runner stage.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter=@repo/api deploy --prod /prod/api

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# The deploy bundle is portable: just copy it. No install step needed.
COPY --from=builder /prod/api ./

EXPOSE 8080

CMD ["node", "dist/main"]
