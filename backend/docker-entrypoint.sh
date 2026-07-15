#!/bin/sh
set -e

# The Prisma schema + migrations were copied into /app/prisma during the
# Docker build (the schema lives at the repo root, outside the backend build
# context). Generate the client and apply pending migrations before booting.
echo "Generating Prisma client..."
npx prisma generate

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node dist/main
