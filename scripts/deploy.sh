#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting deployment process..."

# Check if all required environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$SESSION_SECRET" ]; then
    echo "❌ Error: DATABASE_URL and SESSION_SECRET must be set"
    exit 1
fi

echo "📦 Building Docker image..."
docker build -f Dockerfile.production -t scholarforge:latest .

echo "🔄 Stopping existing container..."
docker stop scholarforge || true
docker rm scholarforge || true

echo "🚢 Deploying new container..."
docker run -d \
    --name scholarforge \
    --restart unless-stopped \
    -p 8081:8081 \
    -e NODE_ENV=production \
    -e DATABASE_URL="$DATABASE_URL" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
    -e YAHOO_CLIENT_ID="$YAHOO_CLIENT_ID" \
    -e YAHOO_CLIENT_SECRET="$YAHOO_CLIENT_SECRET" \
    scholarforge:latest

echo "⏳ Waiting for container to be healthy..."
sleep 10

# Health check
if curl -f http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Container is healthy."
else
    echo "❌ Deployment failed - container not responding"
    exit 1
fi

echo "📊 Container status:"
docker ps | grep scholarforge

echo "📋 Recent logs:"
docker logs --tail 50 scholarforge
