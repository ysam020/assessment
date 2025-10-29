# Stage 1: Prune the monorepo to only include auth-service dependencies
FROM node:18-alpine AS pruner
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy the entire monorepo
COPY . .

# Generate a pruned monorepo for auth-service
RUN turbo prune @studyAbroad/auth-service --docker

# Stage 2: Install dependencies
FROM node:18-alpine AS installer
WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies
RUN npm ci

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 authservice

# Copy necessary files
COPY --from=installer --chown=authservice:nodejs /app .

USER authservice

# Expose gRPC port
EXPOSE 50051

# Set working directory to auth service
WORKDIR /app/apps/auth-service

CMD ["node", "src/index.js"]