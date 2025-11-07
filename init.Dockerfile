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
RUN bun install --frozen-lockfile && bunx prisma generate

# Copy source code
COPY src ./src
COPY index.ts prisma.config.ts tsconfig.json ./

# Install build dependencies (for the build step if needed)
RUN bun install --frozen-lockfile

# Run Prisma migration and seeding
ENTRYPOINT ["sh", "-c", "bunx prisma migrate deploy && bunx prisma db seed"]