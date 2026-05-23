# syntax=docker/dockerfile:1.6

# ───────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Pure dependency install layer. Cached separately from the source-aware
# stages so that source-only edits don't bust `npm ci`.
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ───────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Runs `next build` with `output: 'standalone'`. The standalone build
# emits a minimal server in .next/standalone/ that contains only the
# runtime modules Next actually needs — much smaller than copying the
# full node_modules forward.
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next/font + page metadata can read NEXT_PUBLIC_* env vars at build
# time. The runtime env is set by docker-compose / the platform; passing
# a dummy here keeps the build from failing if a default is needed.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm run build

# ───────────────────────────────────────────────────────────────────────
# Stage 3 — runner
# Slim runtime. Pulls the standalone server, the static asset directory,
# and the prerendered pages. Drops privileges and runs as a non-root
# user.
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# `curl` powers the docker HEALTHCHECK below. `dumb-init` becomes PID 1
# so the Node server receives SIGTERM cleanly during `docker stop`.
RUN apk add --no-cache curl dumb-init

# Non-root user (the `node` user from the base image is uid 1000).
# We pre-create directories with the right ownership so `next start`
# can write the .next/cache directory without escalation.
RUN mkdir -p /app/.next \
 && chown -R node:node /app

USER node

# `output: 'standalone'` lays out the runtime files like this:
#   .next/standalone/  → minimal server.js + just enough node_modules
#   .next/static/      → fingerprinted JS/CSS bundles
#   public/            → static assets (favicon, robots, etc.)
# The standalone server expects its sibling .next/static and public
# directories to be present at runtime, so we copy all three.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD curl -fsS http://localhost:3001/login || exit 1

ENTRYPOINT ["dumb-init", "--", "node", "server.js"]
