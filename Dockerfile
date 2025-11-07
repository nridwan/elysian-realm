# Use the official Bun image as the base image
FROM oven/bun:1.3.1-alpine AS base

# Set the working directory
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json ./package.json
COPY bun.lockb ./bun.lockb

# Copy Prisma files
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bunx prisma generate

# Build stage
FROM oven/bun:1.2.21-alpine AS build

# Set the working directory
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files from base stage
COPY --from=base /app/node_modules ./node_modules
COPY package.json bun.lockb ./

# Copy Prisma files
COPY --from=base /app/prisma ./prisma/

# Copy source code
COPY src ./src
COPY index.ts prisma.config.ts tsconfig.json ./

# Build optimized binary
RUN bun run build

# Production stage
FROM alpine:3.22 AS production

# Install system dependencies
RUN apk add --no-cache libgcc libstdc++ openssl

# Set the working directory
WORKDIR /app

# Copy the compiled binary from build stage
COPY --from=build /app/server ./server

# Copy Prisma files
COPY --from=base /app/prisma ./prisma/

# Copy Prisma files
COPY --from=base /app/node_modules/.prisma/client ./node_modules/.prisma/client/

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ./server --health || exit 1

# Command to run the application
ENTRYPOINT ["./server"]