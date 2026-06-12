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

RUN pnpm turbo run build --filter=@repo/web...

EXPOSE 3000

CMD ["pnpm", "--filter", "@repo/web", "start"]
