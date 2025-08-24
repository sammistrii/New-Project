#!/bin/bash

echo "🚀 Starting Eco-Points System locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

echo "📦 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U eco_points_user -d eco_points > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready yet"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready yet"
fi

# Check MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is ready"
else
    echo "❌ MinIO is not ready yet"
fi

echo ""
echo "🌐 Services are starting up..."
echo "📊 Backend API: http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api/docs"
echo "🏥 Health Check: http://localhost:3001/health"
echo "🎨 Frontend: http://localhost:3000"
echo "🗄️ MinIO Console: http://localhost:9001"
echo "🔑 MinIO Credentials: minioadmin / minioadmin123"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop services: docker-compose down"
echo ""
echo "🎯 Your Eco-Points System is starting locally!"