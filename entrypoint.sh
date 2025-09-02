#!/bin/sh

# Run database migrations
echo "Running database migrations..."
bunx prisma migrate deploy

# Start the application
echo "Starting application..."
exec bun run src/index.ts