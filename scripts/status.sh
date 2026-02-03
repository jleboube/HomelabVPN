#!/bin/bash

#######################################
# HomelabVPN Status Check Script
# Checks the health of all services
#######################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          HomelabVPN Service Status                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect deployment type
if command -v kubectl &> /dev/null && kubectl get namespace homelabvpn &> /dev/null; then
    DEPLOY_TYPE="kubernetes"
elif command -v docker &> /dev/null && docker ps --filter "name=homelabvpn" --format "{{.Names}}" | grep -q homelabvpn; then
    DEPLOY_TYPE="docker"
else
    echo -e "${YELLOW}No deployment detected${NC}"
    echo "Run ./scripts/deploy.sh to deploy HomelabVPN"
    exit 0
fi

check_docker_status() {
    echo -e "${BOLD}Docker Compose Services:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    services=("homelabvpn-postgres" "homelabvpn-redis" "homelabvpn-api" "homelabvpn-frontend" "homelabvpn-admin" "homelabvpn-wireguard")

    for service in "${services[@]}"; do
        status=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null)
        health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null)

        if [ "$status" = "running" ]; then
            if [ "$health" = "healthy" ] || [ -z "$health" ]; then
                echo -e "  ${GREEN}●${NC} $service: running"
            else
                echo -e "  ${YELLOW}●${NC} $service: running ($health)"
            fi
        elif [ -n "$status" ]; then
            echo -e "  ${RED}●${NC} $service: $status"
        else
            echo -e "  ${RED}○${NC} $service: not found"
        fi
    done

    echo ""
    echo -e "${BOLD}Resource Usage:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep homelabvpn || true
}

check_kubernetes_status() {
    echo -e "${BOLD}Kubernetes Deployments:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl get deployments -n homelabvpn -o wide

    echo ""
    echo -e "${BOLD}Pods:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl get pods -n homelabvpn -o wide

    echo ""
    echo -e "${BOLD}Services:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl get svc -n homelabvpn

    echo ""
    echo -e "${BOLD}Horizontal Pod Autoscalers:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl get hpa -n homelabvpn

    echo ""
    echo -e "${BOLD}Ingress:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    kubectl get ingress -n homelabvpn
}

check_endpoints() {
    echo ""
    echo -e "${BOLD}Endpoint Health Checks:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # API Health
    if curl -sf "http://localhost:8080/health" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} API (localhost:8080/health): healthy"
    else
        echo -e "  ${RED}✗${NC} API (localhost:8080/health): unreachable"
    fi

    # Frontend
    if curl -sf "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend (localhost:3000): responding"
    else
        echo -e "  ${RED}✗${NC} Frontend (localhost:3000): unreachable"
    fi

    # Admin
    if curl -sf "http://localhost:3001" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Admin (localhost:3001): responding"
    else
        echo -e "  ${RED}✗${NC} Admin (localhost:3001): unreachable"
    fi

    # Prometheus metrics
    if curl -sf "http://localhost:8080/metrics" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Prometheus (localhost:8080/metrics): available"
    else
        echo -e "  ${YELLOW}!${NC} Prometheus (localhost:8080/metrics): unavailable"
    fi

    # External endpoints (if domain is set)
    if [ -n "$DOMAIN" ]; then
        echo ""
        echo -e "${BOLD}External Endpoints:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        if curl -sf "https://${DOMAIN}" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} https://${DOMAIN}: reachable"
        else
            echo -e "  ${YELLOW}!${NC} https://${DOMAIN}: not reachable (DNS/SSL may not be configured)"
        fi

        if curl -sf "https://api.${DOMAIN}/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} https://api.${DOMAIN}: healthy"
        else
            echo -e "  ${YELLOW}!${NC} https://api.${DOMAIN}: not reachable"
        fi

        if curl -sf "https://admin.${DOMAIN}" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} https://admin.${DOMAIN}: reachable"
        else
            echo -e "  ${YELLOW}!${NC} https://admin.${DOMAIN}: not reachable"
        fi
    fi
}

# Main
case "$DEPLOY_TYPE" in
    docker)
        echo -e "Deployment Type: ${CYAN}Docker Compose${NC}"
        echo ""
        check_docker_status
        ;;
    kubernetes)
        echo -e "Deployment Type: ${CYAN}Kubernetes${NC}"
        echo ""
        check_kubernetes_status
        ;;
esac

check_endpoints

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Status check completed at $(date)"
