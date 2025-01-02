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
COPY --from=builder /app/src/certs/scvapp-704a1-firebase-adminsdk-ao353-c43acd203a.json ./src/certs/scvapp-704a1-firebase-adminsdk-ao353-c43acd203a.json

RUN touch .env

EXPOSE 5050

CMD ["node" , "dist/main.js"]
