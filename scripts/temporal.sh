#!/bin/bash
# Cross-platform Temporal management script - works on WSL, Git Bash, and native Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="temporal-dev-server"
TEMPORAL_PORT=7233
UI_PORT=8233
MAX_WAIT_TIME=30

# Detect environment
detect_environment() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

ENVIRONMENT=$(detect_environment)

# Function to print colored messages
log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Function to check if port is available
check_port() {
    local port=$1
    if command -v netstat >/dev/null 2>&1; then
        if netstat -an 2>/dev/null | grep -q ":$port "; then
            return 1
        fi
    elif command -v lsof >/dev/null 2>&1; then
        if lsof -i:$port >/dev/null 2>&1; then
            return 1
        fi
    fi
    return 0
}

# Function to cleanup existing containers
cleanup_existing() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "Found existing Temporal container, cleaning up..."
        docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
        docker rm $CONTAINER_NAME >/dev/null 2>&1 || true
        sleep 2
    fi
}

# Function to wait for server readiness
wait_for_temporal() {
    local elapsed=0

    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        # Check if container is running
        if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            return 1
        fi

        # Check if Temporal is responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$UI_PORT 2>/dev/null | grep -q "200\|301\|302"; then
            return 0
        fi

        sleep 1
        elapsed=$((elapsed + 1))

        # Show progress every 5 seconds
        if [ $((elapsed % 5)) -eq 0 ]; then
            echo "   Still waiting... ($elapsed/$MAX_WAIT_TIME seconds)"
        fi
    done

    return 1
}

# Function to get Docker run command based on environment
get_docker_command() {
    local image=$1

    # Base command
    local cmd="docker run -d --name $CONTAINER_NAME"
    cmd="$cmd -p ${TEMPORAL_PORT}:7233"
    cmd="$cmd -p ${UI_PORT}:8233"

    # Environment-specific configuration
    if [[ "$ENVIRONMENT" == "windows" ]]; then
        # For Git Bash/Windows, use in-memory database to avoid path issues
        cmd="$cmd $image server start-dev --ui-port 8233 --ip 0.0.0.0"
    elif [[ "$ENVIRONMENT" == "wsl" ]]; then
        # For WSL, we can use volumes safely
        docker volume create temporal-data >/dev/null 2>&1 || true
        # Use double slash to prevent Git Bash path translation
        cmd="$cmd -v temporal-data://temporal-data"
        cmd="$cmd $image server start-dev --ui-port 8233 --db-filename //temporal-data/temporal.db --ip 0.0.0.0"
    else
        # For native Linux
        docker volume create temporal-data >/dev/null 2>&1 || true
        cmd="$cmd -v temporal-data:/temporal-data"
        cmd="$cmd $image server start-dev --ui-port 8233 --db-filename /temporal-data/temporal.db --ip 0.0.0.0"
    fi

    echo "$cmd"
}

# Main execution
main() {
    echo "🚀 Temporal Server Manager"
    echo "=========================="
    echo ""

    # 1. Check Docker
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running!"
        echo "   Please start Docker Desktop and try again."
        exit 1
    fi
    log_info "Docker is running"

    # 2. Check ports
    if ! check_port $TEMPORAL_PORT; then
        log_warn "Port $TEMPORAL_PORT is already in use"
        # Check if it's our Temporal
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            log_info "Temporal is already running"
            echo ""
            echo "📊 Server Status:"
            echo "   - Temporal Server: http://localhost:$TEMPORAL_PORT"
            echo "   - Web UI: http://localhost:$UI_PORT"
            echo ""
            echo "🛑 To restart, run: npm run temporal:stop && npm run temporal"
            exit 0
        else
            log_error "Port $TEMPORAL_PORT is in use by another application"
            echo "   Please stop the application using port $TEMPORAL_PORT"
            exit 1
        fi
    fi

    if ! check_port $UI_PORT; then
        log_warn "Port $UI_PORT is already in use"
        # Try to clean up orphaned containers
        if docker ps -a | grep -q temporal-dev-server; then
            log_info "Found orphaned Temporal container, cleaning up..."
            docker stop temporal-dev-server 2>/dev/null || true
            docker rm temporal-dev-server 2>/dev/null || true
            sleep 2
        fi
    fi

    # 3. Cleanup any existing containers
    cleanup_existing

    # 4. Pull the latest image
    log_info "Ensuring Temporal Docker image is available..."
    IMAGE="temporalio/temporal:latest"

    if ! docker image inspect $IMAGE >/dev/null 2>&1; then
        log_info "Pulling Temporal image..."
        if ! docker pull $IMAGE 2>/dev/null; then
            log_error "Failed to pull Temporal image"
            echo "   Trying alternative image..."
            IMAGE="temporalio/auto-setup:latest"
            if ! docker pull $IMAGE 2>/dev/null; then
                log_error "Failed to pull any Temporal images"
                echo "   Please check your internet connection and Docker configuration"
                exit 1
            fi
        fi
    fi

    # 5. Start Temporal with environment-specific command
    log_info "Starting Temporal server..."

    # Show environment detection
    if [[ "$ENVIRONMENT" == "windows" ]]; then
        log_info "Detected Windows environment (Git Bash/MSYS)"
    elif [[ "$ENVIRONMENT" == "wsl" ]]; then
        log_info "Detected WSL environment"
    else
        log_info "Detected Linux environment"
    fi

    DOCKER_CMD=$(get_docker_command $IMAGE)

    # Execute Docker command
    CONTAINER_ID=$(eval $DOCKER_CMD 2>&1)

    if [ $? -ne 0 ]; then
        log_error "Failed to start container"
        echo "$CONTAINER_ID"

        # If using auto-setup image, try with different config
        if [[ "$IMAGE" == *"auto-setup"* ]]; then
            log_warn "Trying auto-setup image with basic configuration..."
            CONTAINER_ID=$(docker run -d \
                --name $CONTAINER_NAME \
                -p ${TEMPORAL_PORT}:7233 \
                -p ${UI_PORT}:8233 \
                -e "SKIP_SCHEMA_SETUP=false" \
                -e "SKIP_DEFAULT_NAMESPACE_CREATION=false" \
                $IMAGE 2>&1)

            if [ $? -ne 0 ]; then
                log_error "Alternative startup also failed"
                echo "$CONTAINER_ID"
                exit 1
            fi
        else
            exit 1
        fi
    fi

    log_info "Container started (${CONTAINER_ID:0:12})"

    # 6. Wait for Temporal to be ready
    echo "⏳ Waiting for Temporal to be ready..."

    if wait_for_temporal; then
        log_info "Temporal is ready!"
        echo ""
        echo "📊 Server Status:"
        echo "   - Temporal Server: http://localhost:$TEMPORAL_PORT"
        echo "   - Web UI: http://localhost:$UI_PORT"
        echo "   - Environment: $ENVIRONMENT"
        if [[ "$ENVIRONMENT" == "windows" ]]; then
            echo "   - Storage: In-memory (no persistence)"
        else
            echo "   - Storage: Docker volume (persistent)"
        fi
        echo ""
        echo "📝 Next Steps:"
        echo "   1. Open Web UI: http://localhost:$UI_PORT"
        echo "   2. Start worker: npm run temporal:worker"
        echo "   3. Run your application"
        echo ""
        echo "🛑 To stop: npm run temporal:stop"
        echo "📋 View logs: npm run temporal:logs"
    else
        log_error "Temporal failed to become ready"
        echo ""
        echo "Checking container logs..."
        echo "------------------------"
        docker logs $CONTAINER_NAME 2>&1 | tail -30
        echo "------------------------"

        # Check if container is still running
        if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            log_error "Container exited unexpectedly"
            echo ""
            echo "Troubleshooting steps:"
            echo "  1. Check Docker memory (needs at least 2GB)"
            echo "  2. Try: docker system prune"
            echo "  3. Restart Docker Desktop"
            if [[ "$ENVIRONMENT" == "windows" ]]; then
                echo "  4. Try running from WSL instead of Git Bash"
            fi
        fi

        # Cleanup failed container
        docker rm -f $CONTAINER_NAME >/dev/null 2>&1
        exit 1
    fi
}

# Run main function
main