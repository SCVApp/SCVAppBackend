FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./ 

RUN npm ci

RUN npm i -g @nestjs/cli

COPY . .

RUN npm run build


FROM node:16-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src ./src

COPY --from=builder /app/.env.production ./.env

EXPOSE 5050

CMD ["node" , "dist/main.js"]
