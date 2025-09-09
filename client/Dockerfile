# Build stage
FROM oven/bun:1.2.21-alpine AS builder

# Set working directory
WORKDIR /app

# Define build arguments
ARG VITE_API_BASE_URL
ARG NODE_ENV

# Set environment variables from build arguments
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NODE_ENV=${NODE_ENV}

# Install system dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run prepare
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]