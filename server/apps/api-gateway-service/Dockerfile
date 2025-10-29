# Stage 1: Prune
FROM node:18-alpine AS pruner
WORKDIR /app

RUN npm install -g turbo

COPY . .
RUN turbo prune @studyAbroad/api-gateway-service --docker

# Stage 2: Install
FROM node:18-alpine AS installer
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

RUN npm ci

COPY --from=pruner /app/out/full/ .

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apigateway

COPY --from=installer --chown=apigateway:nodejs /app .

USER apigateway

EXPOSE 9000

WORKDIR /app/apps/api-gateway-service

CMD ["node", "src/index.js"]