FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.32.1 --activate

# Dependency layer: invalidated only when the lockfile changes. `pnpm fetch`
# downloads every package into the store from the lockfile alone, and the
# BuildKit cache mount persists that store across builds.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

COPY package.json turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline
RUN pnpm turbo run build --filter=@repo/api...

EXPOSE 8080

CMD ["pnpm", "--filter", "@repo/api", "start:prod"]
