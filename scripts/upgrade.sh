#!/bin/bash

#######################################
# HomelabVPN Upgrade Script
# Pulls latest code and redeploys
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          HomelabVPN Upgrade Script                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd "$PROJECT_ROOT"

# Check if this is a git repository
if [ ! -d ".git" ]; then
    log_error "Not a git repository. Cannot pull updates."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    log_warning "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? [y/N]: " response
    if [[ ! "$response" =~ ^[yY] ]]; then
        log_info "Upgrade cancelled"
        exit 0
    fi
fi

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
else
    log_error "No .env file found. Run ./scripts/deploy.sh first."
    exit 1
fi

# Detect deployment type
if command -v kubectl &> /dev/null && kubectl get namespace homelabvpn &> /dev/null 2>&1; then
    DEPLOY_TYPE="kubernetes"
elif command -v docker &> /dev/null && docker ps --filter "name=homelabvpn" --format "{{.Names}}" 2>/dev/null | grep -q homelabvpn; then
    DEPLOY_TYPE="docker"
else
    log_error "No deployment detected"
    exit 1
fi

log_info "Deployment type: $DEPLOY_TYPE"

# Backup current state
log_info "Creating backup of current configuration..."
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/.env.backup"
log_success "Backup saved to $BACKUP_DIR"

# Pull latest changes
log_info "Pulling latest changes from git..."
CURRENT_COMMIT=$(git rev-parse HEAD)
git pull origin "$(git rev-parse --abbrev-ref HEAD)"
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log_info "Already up to date"
else
    log_success "Updated from ${CURRENT_COMMIT:0:8} to ${NEW_COMMIT:0:8}"
    echo ""
    echo "Changes:"
    git log --oneline "$CURRENT_COMMIT..$NEW_COMMIT"
fi

# Check for database migrations
if [ -f "$PROJECT_ROOT/backend/internal/db/migrations/pending" ]; then
    log_warning "Database migrations may be required"
    echo "Check $PROJECT_ROOT/backend/internal/db/migrations/"
fi

# Rebuild images
log_info "Rebuilding Docker images..."

docker build -t homelabvpn/api:latest -f backend/Dockerfile backend/
log_success "API image rebuilt"

docker build -t homelabvpn/frontend:latest \
    --build-arg NEXT_PUBLIC_API_URL="${API_URL:-https://api.${DOMAIN}}" \
    --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
    --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
    -f frontend/Dockerfile frontend/
log_success "Frontend image rebuilt"

docker build -t homelabvpn/admin:latest \
    --build-arg NEXT_PUBLIC_API_URL="${API_URL:-https://api.${DOMAIN}}" \
    -f admin/Dockerfile admin/
log_success "Admin image rebuilt"

# Deploy based on type
case "$DEPLOY_TYPE" in
    docker)
        log_info "Restarting Docker Compose services..."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
        else
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
        fi
        log_success "Docker Compose services restarted"
        ;;
    kubernetes)
        log_info "Rolling out Kubernetes deployments..."

        # Push to registry if configured
        if [ -n "$DOCKER_REGISTRY" ]; then
            log_info "Pushing images to registry..."
            docker tag homelabvpn/api:latest $DOCKER_REGISTRY/homelabvpn/api:latest
            docker tag homelabvpn/frontend:latest $DOCKER_REGISTRY/homelabvpn/frontend:latest
            docker tag homelabvpn/admin:latest $DOCKER_REGISTRY/homelabvpn/admin:latest
            docker push $DOCKER_REGISTRY/homelabvpn/api:latest
            docker push $DOCKER_REGISTRY/homelabvpn/frontend:latest
            docker push $DOCKER_REGISTRY/homelabvpn/admin:latest
        fi

        # Apply any new manifests
        kubectl apply -f kubernetes/

        # Rollout restart
        kubectl rollout restart deployment/homelabvpn-api -n homelabvpn
        kubectl rollout restart deployment/homelabvpn-web -n homelabvpn
        kubectl rollout restart deployment/homelabvpn-admin-web -n homelabvpn

        # Wait for rollouts
        kubectl rollout status deployment/homelabvpn-api -n homelabvpn --timeout=300s
        kubectl rollout status deployment/homelabvpn-web -n homelabvpn --timeout=300s
        kubectl rollout status deployment/homelabvpn-admin-web -n homelabvpn --timeout=300s

        log_success "Kubernetes deployments updated"
        ;;
esac

# Health check
log_info "Running health checks..."
sleep 5

if curl -sf "http://localhost:8080/health" > /dev/null 2>&1; then
    log_success "API is healthy"
else
    log_warning "API health check failed - it may still be starting"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Upgrade completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Run './scripts/status.sh' to check service status"
echo "Run './scripts/logs.sh api -f' to view logs"
