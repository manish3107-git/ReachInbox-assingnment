#!/bin/bash

# ReachInbox Setup Script
echo "🚀 Setting up ReachInbox..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p chroma_db
mkdir -p ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the application."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:3000/health || echo "❌ Backend health check failed"

echo "✅ Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo "   Health Check: http://localhost:3000/health"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env file with your API keys and email accounts"
echo "   2. Restart services: docker-compose restart"
echo "   3. Check logs: docker-compose logs -f"
echo ""
echo "🔧 Useful commands:"
echo "   Stop services: docker-compose down"
echo "   View logs: docker-compose logs -f"
echo "   Restart: docker-compose restart"


