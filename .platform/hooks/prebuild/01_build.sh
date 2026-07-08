#!/bin/bash
set -e

# Load EB environment variables (DATABASE_URL, AUTH_SECRET, etc.) into this hook's shell
if [ -f /opt/elasticbeanstalk/deployment/env ]; then
  set -a
  source /opt/elasticbeanstalk/deployment/env
  set +a
fi

cd /var/app/staging

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Building Next.js app..."
npm run build

echo "Prebuild hook completed successfully."
