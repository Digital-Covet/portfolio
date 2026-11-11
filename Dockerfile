# Portfolio - Digital Covet. One image, two entrypoints:
#   web:     node bin/server.js                                  (default CMD)
#   migrate: node ace migration:run --connection=postgres_direct --force
#   prune:   node ace files:prune --force --hours=24
# Configuration comes from environment variables only; Postgres and object
# storage are hosted externally, so the container is stateless.

ARG NODE_VERSION=26.13.0

# ----------------------------
# Shared base with pnpm
# ----------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION=12.17.0
RUN npm install -g --allow-scripts=pnpm pnpm@${PNPM_VERSION}
WORKDIR /app

# ----------------------------
# Stage 1: Install all dependencies
# ----------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# ----------------------------
# Stage 2: Build the application
# ----------------------------
FROM deps AS build
COPY . .

# Vite inlines VITE_* variables at build time.
ARG VITE_APP_NAME="Portfolio - Digital Covet"
ARG VITE_IAM_ACCOUNT_URL=""
ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_IAM_ACCOUNT_URL=${VITE_IAM_ACCOUNT_URL}

RUN pnpm run build

# ----------------------------
# Stage 3: Production dependencies
# ----------------------------
FROM base AS prod-deps
ENV NODE_ENV=production

# `node ace build` copies package.json and the lock file, but not
# pnpm-workspace.yaml (which holds the allowBuilds settings used to install
# native modules such as better-sqlite3).
COPY --from=build /app/build/package.json /app/build/pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --store-dir=/pnpm/store

# ----------------------------
# Stage 4: Production runtime
# ----------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="Portfolio - Digital Covet" \
      org.opencontainers.image.description="Client portfolio, case studies and share portal" \
      org.opencontainers.image.source="https://github.com/Digital-Covet/portfolio" \
      org.opencontainers.image.licenses="UNLICENSED"

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3333 \
    TZ=UTC

WORKDIR /app

COPY --from=build --chown=node:node /app/build ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# AdonisJS writes request uploads into ./tmp before forwarding them to
# Supabase Object Storage. Kubernetes mounts an emptyDir here.
RUN mkdir -p tmp && chown -R node:node /app

USER node

EXPOSE 3333

# Used by Podman/plain container runtimes. Kubernetes uses its own probes
# against the same endpoint and ignores this instruction.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3333) + '/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "bin/server.js"]
