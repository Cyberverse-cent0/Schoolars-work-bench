#!/bin/bash

# ScholarForge Single Server Startup Script
# Runs both API and frontend on port 4500

set -e

echo "=== ScholarForge Server Startup ==="
echo "Starting server on port 4500..."

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is already in use"
        return 1
    else
        echo "Port $port is available"
        return 0
    fi
}

# Function to kill any existing processes on port 4500
kill_existing_processes() {
    echo "Checking for existing processes on port 4500..."
    
    # Find and kill processes using port 4500
    local pids=$(lsof -ti :4500 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Killing existing processes: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Also kill any node processes that might be running our servers
    local node_pids=$(ps aux | grep "node.*dist/index.mjs" | grep -v grep | awk '{print $2}' || true)
    if [ -n "$node_pids" ]; then
        echo "Killing existing API server processes: $node_pids"
        echo "$node_pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    local vite_pids=$(ps aux | grep "vite.*4500" | grep -v grep | awk '{print $2}' || true)
    if [ -n "$vite_pids" ]; then
        echo "Killing existing frontend processes: $vite_pids"
        echo "$vite_pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to start the API server
start_api_server() {
    echo "Starting API server..."
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/artifacts/api-server"
    
    # Build the API server
    echo "Building API server..."
    npm run build
    
    # Start API server in background
    echo "Starting API server on port 4500..."
    nohup npm start > logs/api-server.log 2>&1 &
    API_PID=$!
    echo "API server started with PID: $API_PID"
    
    # Wait for API server to start
    echo "Waiting for API server to start..."
    sleep 5
    
    # Check if API server is running
    if kill -0 $API_PID 2>/dev/null; then
        echo "API server is running"
        echo "Health check: http://localhost:4500/api/health"
    else
        echo "API server failed to start"
        exit 1
    fi
}

# Function to start the frontend
start_frontend() {
    echo "Starting frontend..."
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/../artifacts/scholar-forge"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    echo "Starting frontend on port 4500..."
    nohup npm run dev > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 10
    
    # Check if frontend is running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Frontend is running"
        echo "Frontend URL: http://localhost:4500"
    else
        echo "Frontend failed to start"
        exit 1
    fi
}

# Function to test the server
test_server() {
    echo "Testing server..."
    
    # Test API health endpoint
    echo "Testing API health endpoint..."
    if curl -s http://localhost:4500/api/health >/dev/null 2>&1; then
        echo "API health check: OK"
    else
        echo "API health check: FAILED"
        return 1
    fi
    
    # Test frontend
    echo "Testing frontend..."
    if curl -s http://localhost:4500 >/dev/null 2>&1; then
        echo "Frontend check: OK"
    else
        echo "Frontend check: FAILED"
        return 1
    fi
    
    echo "Server tests completed successfully"
}

# Main execution
main() {
    # Create logs directory
    mkdir -p artifacts/logs
    
    # Kill existing processes
    kill_existing_processes
    
    # Check if port is available
    if ! check_port 4500; then
        echo "Port 4500 is not available. Please check what's running on this port."
        exit 1
    fi
    
    # Start servers
    start_api_server
    start_frontend
    
    # Test the server
    test_server
    
    echo ""
    echo "=== Server Started Successfully ==="
    echo "API Server: http://localhost:4500/api/health"
    echo "Frontend: http://localhost:4500"
    echo "Admin Panel: http://localhost:4500/admin"
    echo ""
    echo "API Server PID: $API_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "To stop the server, run:"
    echo "kill $API_PID $FRONTEND_PID"
    echo ""
    echo "To view logs:"
    echo "tail -f logs/api-server.log"
    echo "tail -f logs/frontend.log"
    echo ""
    echo "Server is ready for use!"
}

# Run main function
main
