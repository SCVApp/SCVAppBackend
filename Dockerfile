FROM node:24-alpine AS builder

# Bun installs dependencies; the Nest CLI build itself must run on Node,
# because under Bun it does not rewrite 'src/...' imports to relative paths
COPY --from=oven/bun:1.4.4-alpine /usr/local/bin/bun /usr/local/bin/bun

RUN apk add g++ make py3-pip

WORKDIR /app

COPY package.json bun.lock ./

# --ignore-scripts: the deprecated grpc package (pulled in by fcm-notification's
# old firebase-admin, only used for Firestore) fails to compile on Node 24.
# bcrypt ships prebuilt binaries, so no install scripts are needed.
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

RUN bun run build

# Remove dev dependencies to prepare for production
RUN rm -rf node_modules && bun install --frozen-lockfile --production --ignore-scripts


FROM oven/bun:1.4.4-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/bun.lock ./

# Copy already-built node_modules from builder (with dev deps removed)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src ./src

# COPY --from=builder /app/.env.production ./.env

RUN touch .env

ARG FCM_CERT
ARG JWT_PRIVATE_KEY
ARG JWT_PUBLIC_KEY

# For Firebase Cloud Messaging to work
RUN mkdir ./src/certs
RUN echo -e "$FCM_CERT" | base64 -d > ./src/certs/fcm-cert.json
#For public and private key to work
RUN echo -e "$JWT_PRIVATE_KEY" | base64 -d > ./src/certs/jwtRS256.key
RUN echo -e "$JWT_PUBLIC_KEY" | base64 -d > ./src/certs/jwtRS256.key.pub
#

EXPOSE 5050

ENV NODE_ENV=production

CMD ["bun", "dist/main.js"]
