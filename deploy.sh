#!/bin/bash

# Deployment script for AWS EC2 Free Tier
echo "Starting deployment process..."

# Build Docker image
echo "Building Docker image..."
docker build -t cv-backend:latest .

# Stop existing container if running
echo "Stopping existing container..."
docker stop cv-backend 2>/dev/null || true
docker rm cv-backend 2>/dev/null || true

# Run new container
echo "Starting new container..."
docker run -d \
  --name cv-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  -v /tmp:/tmp \
  --memory="1g" \
  --cpus="1.0" \
  cv-backend:latest

# Check if container is running
sleep 5
if docker ps | grep -q cv-backend; then
    echo "✅ Deployment successful!"
    echo "Application is running at http://localhost:5000"
    echo "Health check: http://localhost:5000/api/cv/health"
else
    echo "❌ Deployment failed!"
    echo "Container logs:"
    docker logs cv-backend
    exit 1
fi

