#!/bin/bash

# ScholarForge Server Startup Script - Port 4500
# This script runs both API and frontend on port 4500

set -e

echo "=== ScholarForge Server Startup - Port 4500 ==="

# Function to kill existing processes
kill_existing() {
    echo "Killing existing processes on port 4500..."
    pkill -f "node.*4500" || true
    pkill -f "vite.*4500" || true
    sleep 2
}

# Function to start API server
start_api() {
    echo "Starting API server on port 4500..."
    cd artifacts/api-server
    
    # Build API server
    echo "Building API server..."
    npm run build
    
    # Start API server
    echo "Starting API server..."
    PORT=4500 nohup npm start > ../logs/api.log 2>&1 &
    API_PID=$!
    echo "API server PID: $API_PID"
    
    # Wait for API to start
    sleep 5
    
    # Check if API is running
    if curl -s http://localhost:4500/api/health > /dev/null; then
        echo "API server is running"
    else
        echo "API server failed to start"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend on port 4500..."
    cd ../../artifacts/scholar-forge
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend
    echo "Starting frontend..."
    PORT=4500 nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    
    # Wait for frontend to start
    sleep 10
    
    # Check if frontend is running
    if curl -s http://localhost:4500 > /dev/null; then
        echo "Frontend is running"
    else
        echo "Frontend failed to start"
        exit 1
    fi
}

# Main execution
main() {
    # Create logs directory
    mkdir -p logs
    
    # Kill existing processes
    kill_existing
    
    # Start API server
    start_api
    
    # Start frontend
    start_frontend
    
    echo ""
    echo "=== Server Started Successfully ==="
    echo "API Server: http://localhost:4500/api/health"
    echo "Frontend: http://localhost:4500"
    echo "Admin Panel: http://localhost:4500/admin"
    echo ""
    echo "API Server PID: $API_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "To stop the server: kill $API_PID $FRONTEND_PID"
    echo "To view logs: tail -f logs/api.log logs/frontend.log"
    echo ""
    echo "Server is ready on port 4500!"
}

# Run main function
main
