#!/bin/bash

# ScholarForge Server Startup Script
set -e

echo "🚀 Starting ScholarForge servers..."

# Source environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$SESSION_SECRET" ]; then
    echo "❌ Error: DATABASE_URL and SESSION_SECRET must be set"
    exit 1
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port > /dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check if required ports are available
if ! check_port 8081; then
    echo "❌ Port 8081 is already in use. Please stop the existing service."
    exit 1
fi

if ! check_port 5173; then
    echo "❌ Port 5173 is already in use. Please stop the existing service."
    exit 1
fi

echo "📦 Installing dependencies..."
cd artifacts/api-server
pnpm install --no-frozen-lockfile

echo "🏗 Building API server..."
pnpm run build

echo "🔧 Starting API server on port 8081..."
cd artifacts/api-server
nohup npm start > ../logs/api-server.log 2>&1 &
API_PID=$!

echo "README Installing frontend dependencies..."
cd ../artifacts/scholar-forge
pnpm install --no-frozen-lockfile

echo "README Starting frontend server on port 5173..."
# Set PORT environment variable for frontend and run dev server directly
PORT=5173 nohup pnpm dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for servers to start..."
sleep 5

# Check if servers are running
if kill -0 $API_PID 2>/dev/null; then
    echo "✅ API server started (PID: $API_PID)"
else
    echo "❌ API server failed to start"
    exit 1
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server started (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo "📊 Server Status:"
echo "API Server: http://localhost:8081"
echo "Frontend: http://localhost:5173"
echo "Logs: ./logs/"
echo ""
echo "🛑 To stop servers, run:"
echo "kill $API_PID $FRONTEND_PID"
echo ""
echo "📋 View logs with:"
echo "tail -f logs/api-server.log"
echo "tail -f logs/frontend.log"
