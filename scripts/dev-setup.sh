#!/bin/bash

# Eco-Points System Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Eco-Points System development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads frontend

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
if ! docker-compose ps | grep -q "healthy"; then
    echo "⚠️  Services may not be fully ready. Continuing anyway..."
fi

# Run database migrations
echo "🗄️  Setting up database..."
if [ -f "src/database/migrate.js" ]; then
    echo "Running database migrations..."
    npm run db:migrate
else
    echo "No migration script found, database should be initialized by Docker"
fi

# Seed database if script exists
if [ -f "src/database/seed.js" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Services running:"
echo "   - App: http://localhost:3000"
echo "   - Database: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - Adminer (DB): http://localhost:8080"
echo "   - Redis Commander: http://localhost:8081"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🐳 To manage services:"
echo "   docker-compose up -d    # Start all services"
echo "   docker-compose down     # Stop all services"
echo "   docker-compose logs     # View logs"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Start the application: npm run dev"
echo "   3. Visit http://localhost:3000/api/health to verify"
echo "   4. Check the README.md for more information"
echo ""
echo "Happy coding! 🎯"