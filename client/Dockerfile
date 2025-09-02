# Stage 1: Build the application
FROM oven/bun:1.1.38-alpine as build

# Set the working directory
WORKDIR /app

# Copy package files
COPY client/package.json ./
COPY client/bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the client code
COPY client/. .

# Build the application
RUN bun run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy the build output to the nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -s -f http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]