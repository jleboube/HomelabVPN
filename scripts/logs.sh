#!/bin/bash

#######################################
# HomelabVPN Log Viewer Script
#######################################

# Colors
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

show_help() {
    echo "Usage: $0 [service] [options]"
    echo ""
    echo "Services:"
    echo "  api        - Backend API logs"
    echo "  frontend   - Frontend logs"
    echo "  admin      - Admin dashboard logs"
    echo "  postgres   - Database logs"
    echo "  redis      - Redis logs"
    echo "  wireguard  - WireGuard VPN logs"
    echo "  all        - All services (default)"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow log output"
    echo "  -n, --lines N   Number of lines to show (default: 100)"
    echo "  --since TIME    Show logs since timestamp (e.g., '10m', '1h')"
    echo ""
    echo "Examples:"
    echo "  $0 api -f              # Follow API logs"
    echo "  $0 postgres -n 50      # Last 50 postgres logs"
    echo "  $0 all --since 1h      # All logs from last hour"
}

# Detect deployment type
if command -v kubectl &> /dev/null && kubectl get namespace homelabvpn &> /dev/null 2>&1; then
    DEPLOY_TYPE="kubernetes"
elif command -v docker &> /dev/null && docker ps --filter "name=homelabvpn" --format "{{.Names}}" 2>/dev/null | grep -q homelabvpn; then
    DEPLOY_TYPE="docker"
else
    echo "No deployment detected"
    exit 1
fi

# Parse arguments
SERVICE="${1:-all}"
shift || true

FOLLOW=""
LINES="100"
SINCE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        --since)
            SINCE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Docker Compose logs
docker_logs() {
    local service=$1
    local container_name="homelabvpn-${service}"
    local docker_opts="--tail $LINES"

    [ -n "$FOLLOW" ] && docker_opts="$docker_opts -f"
    [ -n "$SINCE" ] && docker_opts="$docker_opts --since $SINCE"

    if [ "$service" = "all" ]; then
        cd "$PROJECT_ROOT"
        if command -v docker-compose &> /dev/null; then
            docker-compose logs $docker_opts
        else
            docker compose logs $docker_opts
        fi
    else
        docker logs $docker_opts "$container_name"
    fi
}

# Kubernetes logs
k8s_logs() {
    local service=$1
    local k8s_opts="--tail=$LINES"

    [ -n "$FOLLOW" ] && k8s_opts="$k8s_opts -f"
    [ -n "$SINCE" ] && k8s_opts="$k8s_opts --since=$SINCE"

    case $service in
        api)
            kubectl logs -n homelabvpn -l component=api $k8s_opts
            ;;
        frontend)
            kubectl logs -n homelabvpn -l component=web $k8s_opts
            ;;
        admin)
            kubectl logs -n homelabvpn -l component=admin-web $k8s_opts
            ;;
        postgres)
            kubectl logs -n homelabvpn -l component=postgres $k8s_opts
            ;;
        redis)
            kubectl logs -n homelabvpn -l component=redis $k8s_opts
            ;;
        wireguard)
            kubectl logs -n homelabvpn -l component=wireguard $k8s_opts
            ;;
        all)
            kubectl logs -n homelabvpn -l app=homelabvpn $k8s_opts
            ;;
        *)
            echo "Unknown service: $service"
            show_help
            exit 1
            ;;
    esac
}

echo -e "${CYAN}Fetching logs for: $SERVICE${NC}"
echo ""

case "$DEPLOY_TYPE" in
    docker)
        docker_logs "$SERVICE"
        ;;
    kubernetes)
        k8s_logs "$SERVICE"
        ;;
esac
