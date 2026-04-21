#!/bin/bash

# ScholarForge Startup Script
echo "🚀 Starting ScholarForge Application..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    source $HOME/.zshrc
fi

# Start PostgreSQL if not running
echo "📦 Starting PostgreSQL database..."
docker-compose -f docker-compose.db.yml up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5433/scholarforge"
export JWT_SECRET="your-jwt-secret-key-change-this-in-production"
export PORT=8080

# Push database schema
echo "🗄️ Setting up database schema..."
pnpm --filter @workspace/db run push

# Start backend API server
echo "🔧 Starting backend API server..."
export PORT=8080
pnpm --filter @workspace/api-server run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server..."
export VITE_API_URL="http://localhost:8080"
export BASE_PATH="/"
pnpm --filter @workspace/scholar-forge run dev &
FRONTEND_PID=$!

echo "✅ ScholarForge is starting up!"
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:8080"
echo "🗄️ Database: localhost:5433"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose -f docker-compose.db.yml down; exit" INT
wait
