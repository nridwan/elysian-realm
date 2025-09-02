# Use the official Bun image as the base image
FROM oven/bun:1.1.38-alpine as base

# Set the working directory
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json ./
COPY bun.lockb ./

# Copy Prisma files
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bunx prisma generate

# Production stage
FROM oven/bun:1.1.38-alpine as production

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

# Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory to the non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Command to run the application
ENTRYPOINT ["./entrypoint.sh"]