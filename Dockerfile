FROM node:22-alpine3.19 AS builder

RUN apk add g++ make py3-pip

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

RUN npm i -g @nestjs/cli

COPY . .

RUN npm run build


FROM node:22-alpine3.19 AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src ./src

# COPY --from=builder /app/.env.production ./.env

RUN touch .env

# For Firebase Cloud Messaging to work
RUN mkdir ./src/certs
RUN --mount=type=secret,id=FCM_CERT \
    cat /run/secrets/FCM_CERT > ./src/certs/fcm-cert.json
# And for public and private key for jwt
RUN --mount=type=secret,id=JWT_PRIVATE_KEY \
    cat /run/secrets/JWT_PRIVATE_KEY > ./src/certs/jwtRS256.key
RUN --mount=type=secret,id=JWT_PUBLIC_KEY \
    cat /run/secrets/JWT_PUBLIC_KEY > ./src/certs/jwtRS256.key.pub

EXPOSE 5050

CMD ["node" , "dist/main.js"]
