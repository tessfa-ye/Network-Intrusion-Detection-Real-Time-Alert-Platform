# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package files AND the prisma folder
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install ALL dependencies (including devDependencies for the build)
RUN npm ci --legacy-peer-deps

# Generate the Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Verify the build output exists
RUN ls -la dist/ && ls -la dist/main.js

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder (includes the generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application, prisma folder, and prisma config from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Render default port is 10000
EXPOSE 10000

# Start: 1. Run DB migrations 2. Start NestJS
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/main"]