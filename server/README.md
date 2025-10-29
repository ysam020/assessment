# Help Study Abroad - Backend Microservices

Backend implementation for Help Study Abroad platform using Node.js with microservices architecture and gRPC communication.

## Overview

This is a monorepo managed by Turborepo containing three independent microservices:

- **Authentication Service** - JWT-based admin authentication
- **Recommendation Service** - AI-powered course recommendations using Gemini AI
- **Course Management Service** - Course CRUD, Elasticsearch search, and Redis caching
- **API Gateway Service** - REST API gateway that communicates with gRPC microservices

## Architecture

The project uses a microservices architecture where each service runs independently and communicates via gRPC. An API Gateway provides REST endpoints to the frontend.

```
Frontend (React) → API Gateway (REST) → Microservices (gRPC)
                                        ├── Auth Service (Port 50051)
                                        ├── Recommendation Service (Port 50052)
                                        └── Course Service (Port 50053)
```

## Tech Stack

**Core Technologies:**

- Node.js & Express.js (API Gateway)
- gRPC (Inter-service communication)
- MongoDB with Prisma ORM
- Redis (Caching)
- Elasticsearch (Search)
- JWT Authentication
- Google Gemini AI
- Docker & Docker Compose
- Turborepo

**Key Libraries:**

- `@grpc/grpc-js` - gRPC implementation
- `@google/generative-ai` - Gemini AI SDK
- `@elastic/elasticsearch` - Elasticsearch client
- `redis` - Redis client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `multer` - File uploads
- `csv-parser` - CSV parsing

## Prerequisites

- Node.js (v18 or higher)
- npm (v11 or higher)
- MongoDB (v7)
- Redis (v7)
- Elasticsearch (v8.11.0)
- Docker & Docker Compose (optional)

## Project Structure

```
server/
├── apps/
│   ├── api-gateway-service/          # REST API Gateway
│   │   ├── src/
│   │   │   ├── controllers/         # Route controllers
│   │   │   ├── middlewares/         # JWT middleware
│   │   │   ├── routes/             # API routes
│   │   │   └── index.js            # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── auth-service/                 # Authentication microservice (gRPC)
│   │   ├── src/
│   │   │   ├── controllers/         # Auth logic
│   │   │   └── index.js            # gRPC server
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── recommendation-service/       # AI recommendation microservice (gRPC)
│   │   ├── src/
│   │   │   ├── controllers/         # Recommendation logic
│   │   │   └── index.js            # gRPC server
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── course-service/               # Course management microservice (gRPC)
│       ├── src/
│       │   ├── controllers/         # Course operations
│       │   ├── services/           # Elasticsearch & Redis services
│       │   │   ├── elasticsearch.service.js
│       │   │   └── redis.service.js
│       │   └── index.js            # gRPC server
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── proto-defs/                   # Protocol Buffer definitions
│   │   ├── src/
│   │   │   ├── proto/              # .proto files
│   │   │   ├── generated/          # Generated TypeScript
│   │   │   └── compiled/           # Compiled JavaScript
│   │   └── package.json
│   │
│   ├── grpc-utils/                   # Shared gRPC utilities
│   │   ├── src/
│   │   │   ├── baseService.js      # Base gRPC service class
│   │   │   ├── grpcClientManager.js
│   │   │   └── responseFormatter.js
│   │   └── package.json
│
├── docker-compose.yml                # Full stack orchestration
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json
└── .env                             # Environment variables (create this)
```

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd server
```

### 2. Install dependencies

The project uses Turborepo for monorepo management. Install all dependencies:

```bash
npm install
```

This will install dependencies for all microservices and packages.

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
# Root .env file
DATABASE_URL=""

# JWT Configuration
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# API Gateway Configuration
API_GATEWAY_PORT=9000
CLIENT_URL="http://localhost:9002"

# Microservice Ports
AUTH_SERVICE_PORT=50051
AUTH_SERVICE_ADDRESS="localhost:50051"

# Recommendation Service
RECOMMENDATION_SERVICE_PORT=50052
RECOMMENDATION_SERVICE_ADDRESS="localhost:50052"

# Course Management Service
COURSE_SERVICE_PORT=50053
COURSE_SERVICE_ADDRESS="localhost:50053"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379

# Node Environment
NODE_ENV="development"

# Logging
LOG_LEVEL="debug"

# Elasticsearch Configuration
ELASTICSEARCH_NODE="http://localhost:9200"
ELASTICSEARCH_USERNAME=""
ELASTICSEARCH_PASSWORD=""
```

### 4. Generate Prisma Client

```bash
cd packages/prisma
npx prisma generate
cd ../..
```

### 5. Generate Protocol Buffers

```bash
npm run proto:gen
npm run proto:compile
```

## Running the Services

### Prerequisites Services

Before starting the microservices, ensure MongoDB, Redis, and Elasticsearch are running:

### Development Mode (Turborepo)

Run all services simultaneously using Turborepo:

```bash
npm run dev
```

This starts:

- Auth Service on port 50051 (gRPC)
- Recommendation Service on port 50052 (gRPC)
- Course Service on port 50053 (gRPC)
- API Gateway on port 9000 (HTTP/REST)

### Docker Compose

Run the entire stack with all dependencies:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

Docker Compose includes:

- MongoDB (Port 27017)
- Redis (Port 6379)
- Elasticsearch (Port 9200)
- Auth Service (Port 50051)
- Recommendation Service (Port 50052)
- Course Service (Port 50053)
- API Gateway (Port 9000)

## API Documentation

All REST APIs are accessible through the API Gateway at `http://localhost:9000/api/v1`

**Note:** If `GEMINI_API_KEY` is not set, the service returns mock recommendations.

## Docker & Deployment

### Dockerizing the Auth Service

The Auth Service uses a multi-stage Dockerfile optimized for monorepo structure:

#### Dockerfile Explanation

```dockerfile
# Stage 1: Prune the monorepo to only include auth-service dependencies
FROM node:18-alpine AS pruner
WORKDIR /app

# Install turbo globally for pruning
RUN npm install -g turbo

# Copy the entire monorepo
COPY . .

# Generate a pruned monorepo for auth-service only
RUN turbo prune @studyAbroad/auth-service --docker

# Stage 2: Install dependencies
FROM node:18-alpine AS installer
WORKDIR /app

# Install build dependencies for native modules (bcrypt requires these)
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

# Don't run as root - create non-privileged user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 authservice

# Copy necessary files from installer
COPY --from=installer --chown=authservice:nodejs /app .

# Switch to non-root user
USER authservice

# Expose gRPC port
EXPOSE 50051

# Set working directory to auth service
WORKDIR /app/apps/auth-service

# Start the service
CMD ["node", "src/index.js"]
```

#### Building and Running Auth Service Docker Image

```bash
# Build the image (from server root directory)
docker build -f apps/auth-service/Dockerfile -t auth-service:latest .

# Run the container
docker run -d \
  --name auth-service \
  -p 50051:50051 \
  -e JWT_SECRET=your_jwt_secret \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/studyabroad \
  -e AUTH_SERVICE_PORT=50051 \
  auth-service:latest

# View logs
docker logs -f auth-service

# Stop the container
docker stop auth-service

# Remove the container
docker rm auth-service
```

#### Building Other Services

The same pattern applies to other services:

```bash
# Course Service
docker build -f apps/course-service/Dockerfile -t course-service:latest .

# Recommendation Service
docker build -f apps/recommendation-service/Dockerfile -t recommendation-service:latest .

# API Gateway
docker build -f apps/api-gateway-service/Dockerfile -t api-gateway:latest .
```

### Docker Compose Setup

The `docker-compose.yml` orchestrates all services and dependencies:

```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up -d --build

# View specific service logs
docker-compose logs -f auth-service

# Restart a service
docker-compose restart auth-service

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Compose Services

- **mongodb**: MongoDB database with persistent volume
- **redis**: Redis cache
- **elasticsearch**: Elasticsearch with single-node setup
- **auth-service**: Authentication gRPC service
- **course-service**: Course management gRPC service
- **recommendation-service**: AI recommendation gRPC service
- **api-gateway**: REST API gateway

All services are connected through a `microservices` bridge network.

## Features Implemented

### ✅ Backend Microservices

- [x] Authentication Service with JWT
- [x] Password hashing with bcrypt
- [x] Protected routes with middleware
- [x] Admin-only access control
- [x] Gemini AI Integration for recommendations
- [x] Fallback to mock data when API unavailable
- [x] Course CRUD operations
- [x] CSV file upload and parsing
- [x] Elasticsearch full-text search
- [x] Redis caching with TTL
- [x] Cache invalidation on updates
- [x] gRPC inter-service communication
- [x] REST API Gateway
- [x] Monorepo with Turborepo
- [x] Protocol Buffers for type-safe APIs

### ✅ DevOps

- [x] Multi-stage Dockerfiles
- [x] Docker Compose orchestration

### ✅ Architecture & Best Practices

- [x] Microservices architecture
- [x] Separation of concerns
- [x] Error handling and validation
- [x] Environment-based configuration
- [x] Non-root Docker containers
- [x] Connection pooling and retries

## Tech Decisions & Rationale

1. **gRPC for Inter-Service Communication**
   - Better performance than REST for internal communication
   - Type-safe APIs with Protocol Buffers
   - Bi-directional streaming support

2. **Turborepo for Monorepo Management**
   - Efficient caching and task execution
   - Simplifies dependency management
   - Better developer experience

3. **Redis Caching Strategy**
   - Reduces database load significantly
   - TTL-based expiration prevents stale data
   - Query-based cache keys for search results

4. **Elasticsearch for Search**
   - Full-text search capabilities
   - Relevance scoring
   - Fuzzy matching and filters
   - Scales better than MongoDB text search

5. **Multi-Stage Docker Builds**
   - Smaller final images (Alpine-based)
   - Faster builds with layer caching
   - Security: non-root user execution

6. **Prisma ORM**
   - Type-safe database queries
   - Easy migrations
   - Works well with TypeScript
