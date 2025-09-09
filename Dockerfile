# Use the official Bun image as the base image
FROM oven/bun:1.2.21-alpine AS base

# Set the working directory
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json ./package.json
COPY bun.lockb ./bun.lockb

# Copy Prisma files
COPY prisma ./prisma/

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
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# Production stage
FROM base AS production

# Install system dependencies
RUN apk add --no-cache openssl

# Set the working directory
WORKDIR /app

# Copy the compiled binary from build stage
COPY --from=build /app/server ./server

# Copy Prisma files
COPY --from=base /app/prisma ./prisma/

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ./server --health || exit 1

# Command to run the application
ENTRYPOINT ["./server"]