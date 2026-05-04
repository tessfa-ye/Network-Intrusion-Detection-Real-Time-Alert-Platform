# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files AND the prisma folder
COPY package*.json ./
COPY prisma ./prisma/ 

# Install dependencies including Prisma
RUN npm ci --legacy-peer-deps

# Generate the Prisma Client (Crucial Step)
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (includes the generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application, prisma folder, and prisma config from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Render default port is 10000
EXPOSE 10000

# Start: 1. Sync DB schema 2. Start NestJS
CMD npx prisma migrate deploy && node dist/main