#!/bin/bash

#######################################
# HomelabVPN Interactive Deployment Script
#
# This script handles the complete deployment process:
# - Environment variable validation and collection
# - Docker image building
# - Deployment to Docker Compose or Kubernetes
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment file paths
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Default values
DEFAULT_DOMAIN="vpn.z-q.me"
DEFAULT_API_PORT="8080"
DEFAULT_FRONTEND_PORT="3000"
DEFAULT_ADMIN_PORT="3001"

#######################################
# Utility Functions
#######################################

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     ${BOLD}HomelabVPN Deployment Script${NC}${CYAN}                        ║"
    echo "║                                                           ║"
    echo "║     Privacy-focused WireGuard VPN Service                 ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Generate a secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -dc 'a-zA-Z0-9' | head -c $length
}

# Validate URL format
validate_url() {
    local url=$1
    if [[ $url =~ ^https?:// ]]; then
        return 0
    fi
    return 1
}

# Validate email format
validate_email() {
    local email=$1
    if [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    fi
    return 1
}

# Prompt for input with default value
prompt_input() {
    local prompt=$1
    local default=$2
    local var_name=$3
    local secret=${4:-false}
    local required=${5:-true}

    local display_default=""
    if [ -n "$default" ]; then
        if [ "$secret" = "true" ]; then
            display_default=" [****]"
        else
            display_default=" [$default]"
        fi
    fi

    if [ "$secret" = "true" ]; then
        read -sp "${prompt}${display_default}: " input
        echo
    else
        read -p "${prompt}${display_default}: " input
    fi

    # Use default if empty
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi

    # Check required
    if [ "$required" = "true" ] && [ -z "$input" ]; then
        log_error "This field is required"
        prompt_input "$prompt" "$default" "$var_name" "$secret" "$required"
        return
    fi

    eval "$var_name='$input'"
}

# Prompt for yes/no
prompt_yes_no() {
    local prompt=$1
    local default=${2:-"y"}

    local options="[Y/n]"
    if [ "$default" = "n" ]; then
        options="[y/N]"
    fi

    read -p "${prompt} ${options}: " response
    response=${response:-$default}

    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

#######################################
# Prerequisite Checks
#######################################

check_prerequisites() {
    log_step "Checking Prerequisites"

    local missing=()

    # Docker
    if command_exists docker; then
        log_success "Docker found: $(docker --version)"
    else
        missing+=("docker")
    fi

    # Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if docker compose version >/dev/null 2>&1; then
            log_success "Docker Compose found: $(docker compose version --short)"
            COMPOSE_CMD="docker compose"
        else
            log_success "Docker Compose found: $(docker-compose --version)"
            COMPOSE_CMD="docker-compose"
        fi
    else
        missing+=("docker-compose")
    fi

    # kubectl (optional for k8s)
    if command_exists kubectl; then
        log_success "kubectl found: $(kubectl version --client -o yaml 2>/dev/null | grep gitVersion | head -1 | awk '{print $2}')"
        HAS_KUBECTL=true
    else
        log_warning "kubectl not found (required for Kubernetes deployment)"
        HAS_KUBECTL=false
    fi

    # openssl for secret generation
    if command_exists openssl; then
        log_success "OpenSSL found"
    else
        missing+=("openssl")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        log_info "Please install the missing tools and try again"
        exit 1
    fi
}

#######################################
# Environment Configuration
#######################################

load_existing_env() {
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading existing environment from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
        return 0
    fi
    return 1
}

collect_environment_variables() {
    log_step "Environment Configuration"

    # Check for existing env file
    if [ -f "$ENV_FILE" ]; then
        log_info "Found existing .env file"
        if prompt_yes_no "Would you like to use existing configuration?"; then
            load_existing_env
            if prompt_yes_no "Would you like to modify any values?"; then
                configure_environment
            fi
            return
        fi
    fi

    configure_environment
}

configure_environment() {
    echo -e "\n${BOLD}Domain Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    prompt_input "Primary domain" "${DOMAIN:-$DEFAULT_DOMAIN}" "DOMAIN"

    # Derive subdomains
    API_DOMAIN="api.${DOMAIN}"
    ADMIN_DOMAIN="admin.${DOMAIN}"

    log_info "API domain will be: $API_DOMAIN"
    log_info "Admin domain will be: $ADMIN_DOMAIN"

    echo -e "\n${BOLD}Database Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    prompt_input "PostgreSQL host" "${POSTGRES_HOST:-postgres}" "POSTGRES_HOST"
    prompt_input "PostgreSQL port" "${POSTGRES_PORT:-5432}" "POSTGRES_PORT"
    prompt_input "PostgreSQL database" "${POSTGRES_DB:-homelabvpn}" "POSTGRES_DB"
    prompt_input "PostgreSQL user" "${POSTGRES_USER:-homelabvpn}" "POSTGRES_USER"

    if [ -z "$POSTGRES_PASSWORD" ]; then
        if prompt_yes_no "Generate random PostgreSQL password?"; then
            POSTGRES_PASSWORD=$(generate_secret 24)
            log_info "Generated PostgreSQL password"
        else
            prompt_input "PostgreSQL password" "" "POSTGRES_PASSWORD" "true"
        fi
    else
        if prompt_yes_no "Keep existing PostgreSQL password?"; then
            :
        else
            prompt_input "PostgreSQL password" "" "POSTGRES_PASSWORD" "true"
        fi
    fi

    DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=disable"

    echo -e "\n${BOLD}Redis Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    prompt_input "Redis host" "${REDIS_HOST:-redis}" "REDIS_HOST"
    prompt_input "Redis port" "${REDIS_PORT:-6379}" "REDIS_PORT"
    REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

    echo -e "\n${BOLD}Security Secrets${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # JWT Secret
    if [ -z "$JWT_SECRET" ]; then
        if prompt_yes_no "Generate random JWT secret?"; then
            JWT_SECRET=$(generate_secret 64)
            log_info "Generated JWT secret"
        else
            prompt_input "JWT secret (min 32 characters)" "" "JWT_SECRET" "true"
        fi
    else
        log_info "Using existing JWT secret"
    fi

    # Admin JWT Secret
    if [ -z "$ADMIN_JWT_SECRET" ]; then
        if prompt_yes_no "Generate random Admin JWT secret?"; then
            ADMIN_JWT_SECRET=$(generate_secret 64)
            log_info "Generated Admin JWT secret"
        else
            prompt_input "Admin JWT secret (min 32 characters)" "" "ADMIN_JWT_SECRET" "true"
        fi
    else
        log_info "Using existing Admin JWT secret"
    fi

    echo -e "\n${BOLD}Google OAuth Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Get credentials at: https://console.cloud.google.com/apis/credentials${NC}"

    prompt_input "Google Client ID" "${GOOGLE_CLIENT_ID:-}" "GOOGLE_CLIENT_ID" "false" "false"

    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        prompt_input "Google Client Secret" "${GOOGLE_CLIENT_SECRET:-}" "GOOGLE_CLIENT_SECRET" "true" "true"
        GOOGLE_REDIRECT_URL="https://${DOMAIN}/api/auth/google/callback"
    else
        log_warning "Skipping Google OAuth - users won't be able to sign in"
        GOOGLE_CLIENT_SECRET=""
        GOOGLE_REDIRECT_URL=""
    fi

    echo -e "\n${BOLD}Stripe Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Get API keys at: https://dashboard.stripe.com/apikeys${NC}"

    prompt_input "Stripe Secret Key (sk_...)" "${STRIPE_SECRET_KEY:-}" "STRIPE_SECRET_KEY" "true" "false"

    if [ -n "$STRIPE_SECRET_KEY" ]; then
        prompt_input "Stripe Publishable Key (pk_...)" "${STRIPE_PUBLISHABLE_KEY:-}" "STRIPE_PUBLISHABLE_KEY" "false" "true"
        prompt_input "Stripe Webhook Secret (whsec_...)" "${STRIPE_WEBHOOK_SECRET:-}" "STRIPE_WEBHOOK_SECRET" "true" "false"
    else
        log_warning "Skipping Stripe - payments won't be available"
        STRIPE_PUBLISHABLE_KEY=""
        STRIPE_WEBHOOK_SECRET=""
    fi

    echo -e "\n${BOLD}Admin Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    prompt_input "Admin email" "${ADMIN_EMAIL:-admin@${DOMAIN}}" "ADMIN_EMAIL"

    if [ -z "$ADMIN_PASSWORD" ]; then
        if prompt_yes_no "Generate random admin password?"; then
            ADMIN_PASSWORD=$(generate_secret 16)
            log_success "Generated admin password: $ADMIN_PASSWORD"
            log_warning "SAVE THIS PASSWORD! It won't be shown again."
        else
            prompt_input "Admin password (min 8 characters)" "" "ADMIN_PASSWORD" "true"
        fi
    fi

    echo -e "\n${BOLD}Email/Contact Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    prompt_input "Support email" "${SUPPORT_EMAIL:-$ADMIN_EMAIL}" "SUPPORT_EMAIL"

    # Set derived URLs
    FRONTEND_URL="https://${DOMAIN}"
    ADMIN_FRONTEND_URL="https://${ADMIN_DOMAIN}"
    API_URL="https://${API_DOMAIN}"
}

save_environment() {
    log_step "Saving Environment Configuration"

    cat > "$ENV_FILE" << EOF
# HomelabVPN Environment Configuration
# Generated on $(date)

# Domain Configuration
DOMAIN=${DOMAIN}
API_DOMAIN=${API_DOMAIN}
ADMIN_DOMAIN=${ADMIN_DOMAIN}

# URLs
FRONTEND_URL=${FRONTEND_URL}
ADMIN_FRONTEND_URL=${ADMIN_FRONTEND_URL}
API_URL=${API_URL}

# Database
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=${DATABASE_URL}

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_URL=${REDIS_URL}

# Security
JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URL=${GOOGLE_REDIRECT_URL}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# Admin
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Support
SUPPORT_EMAIL=${SUPPORT_EMAIL}

# Environment
ENVIRONMENT=production
NODE_ENV=production
EOF

    chmod 600 "$ENV_FILE"
    log_success "Environment saved to $ENV_FILE"
}

#######################################
# Deployment Functions
#######################################

select_deployment_target() {
    log_step "Select Deployment Target"

    echo "Where would you like to deploy?"
    echo ""
    echo "  1) Docker Compose (Local/Single Server)"
    echo "  2) Kubernetes Cluster"
    echo ""

    read -p "Select option [1-2]: " choice

    case $choice in
        1) DEPLOY_TARGET="docker" ;;
        2)
            if [ "$HAS_KUBECTL" = "false" ]; then
                log_error "kubectl is required for Kubernetes deployment"
                exit 1
            fi
            DEPLOY_TARGET="kubernetes"
            ;;
        *)
            log_error "Invalid selection"
            select_deployment_target
            ;;
    esac
}

build_docker_images() {
    log_step "Building Docker Images"

    cd "$PROJECT_ROOT"

    # Build API
    log_info "Building API image..."
    docker build -t homelabvpn/api:latest -f backend/Dockerfile backend/
    log_success "API image built"

    # Build Frontend
    log_info "Building Frontend image..."
    docker build -t homelabvpn/frontend:latest \
        --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
        --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
        --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        -f frontend/Dockerfile frontend/
    log_success "Frontend image built"

    # Build Admin
    log_info "Building Admin Dashboard image..."
    docker build -t homelabvpn/admin:latest \
        --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
        -f admin/Dockerfile admin/
    log_success "Admin Dashboard image built"
}

deploy_docker_compose() {
    log_step "Deploying with Docker Compose"

    cd "$PROJECT_ROOT"

    # Create production docker-compose override
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  postgres:
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    restart: always

  redis:
    restart: always

  api:
    image: homelabvpn/api:latest
    environment:
      PORT: "8080"
      ENVIRONMENT: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URL: ${GOOGLE_REDIRECT_URL}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      ADMIN_FRONTEND_URL: ${ADMIN_FRONTEND_URL}
    restart: always

  frontend:
    image: homelabvpn/frontend:latest
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY}
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    restart: always

  admin:
    image: homelabvpn/admin:latest
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    restart: always

  wireguard:
    environment:
      SERVERURL: ${DOMAIN}
    restart: always
EOF

    # Stop existing containers
    log_info "Stopping existing containers..."
    $COMPOSE_CMD down 2>/dev/null || true

    # Start services
    log_info "Starting services..."
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.prod.yml up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 10

    # Check health
    if curl -sf http://localhost:8080/health > /dev/null; then
        log_success "API is healthy"
    else
        log_warning "API health check failed - it may still be starting"
    fi

    log_success "Docker Compose deployment complete!"
    echo ""
    echo -e "${BOLD}Services are running:${NC}"
    echo "  - Frontend:  http://localhost:3000"
    echo "  - Admin:     http://localhost:3001"
    echo "  - API:       http://localhost:8080"
    echo ""
    echo -e "${YELLOW}Note: Configure your reverse proxy (nginx/traefik) to route traffic from:${NC}"
    echo "  - ${DOMAIN} → localhost:3000"
    echo "  - ${API_DOMAIN} → localhost:8080"
    echo "  - ${ADMIN_DOMAIN} → localhost:3001"
}

deploy_kubernetes() {
    log_step "Deploying to Kubernetes"

    cd "$PROJECT_ROOT"

    # Check cluster connection
    log_info "Checking Kubernetes cluster connection..."
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster"
        log_info "Make sure your kubeconfig is properly configured"
        exit 1
    fi
    log_success "Connected to Kubernetes cluster"

    # Create namespace
    log_info "Creating namespace..."
    kubectl apply -f kubernetes/namespace.yaml

    # Create/update secrets
    log_info "Creating secrets..."
    kubectl create secret generic homelabvpn-secrets \
        --namespace=homelabvpn \
        --from-literal=DATABASE_URL="$DATABASE_URL" \
        --from-literal=REDIS_URL="$REDIS_URL" \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=ADMIN_JWT_SECRET="$ADMIN_JWT_SECRET" \
        --from-literal=GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        --from-literal=GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
        --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
        --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
        --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Update configmap
    log_info "Updating configmap..."
    kubectl create configmap homelabvpn-config \
        --namespace=homelabvpn \
        --from-literal=DOMAIN="$DOMAIN" \
        --from-literal=API_URL="$API_URL" \
        --from-literal=FRONTEND_URL="$FRONTEND_URL" \
        --from-literal=ADMIN_FRONTEND_URL="$ADMIN_FRONTEND_URL" \
        --from-literal=GOOGLE_REDIRECT_URL="$GOOGLE_REDIRECT_URL" \
        --from-literal=ENVIRONMENT="production" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Push images to registry (if configured)
    if [ -n "$DOCKER_REGISTRY" ]; then
        log_info "Pushing images to registry..."
        docker tag homelabvpn/api:latest $DOCKER_REGISTRY/homelabvpn/api:latest
        docker tag homelabvpn/frontend:latest $DOCKER_REGISTRY/homelabvpn/frontend:latest
        docker tag homelabvpn/admin:latest $DOCKER_REGISTRY/homelabvpn/admin:latest
        docker push $DOCKER_REGISTRY/homelabvpn/api:latest
        docker push $DOCKER_REGISTRY/homelabvpn/frontend:latest
        docker push $DOCKER_REGISTRY/homelabvpn/admin:latest
    fi

    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f kubernetes/

    # Wait for deployments
    log_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment/homelabvpn-api -n homelabvpn --timeout=300s
    kubectl rollout status deployment/homelabvpn-web -n homelabvpn --timeout=300s
    kubectl rollout status deployment/homelabvpn-admin-web -n homelabvpn --timeout=300s

    log_success "Kubernetes deployment complete!"
    echo ""
    echo -e "${BOLD}Deployment Status:${NC}"
    kubectl get pods -n homelabvpn
    echo ""
    echo -e "${BOLD}Services:${NC}"
    kubectl get svc -n homelabvpn
    echo ""
    echo -e "${YELLOW}Make sure your DNS is configured:${NC}"
    echo "  - ${DOMAIN} → Ingress IP"
    echo "  - ${API_DOMAIN} → Ingress IP"
    echo "  - ${ADMIN_DOMAIN} → Ingress IP"
}

#######################################
# Post-Deployment
#######################################

show_summary() {
    log_step "Deployment Summary"

    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BOLD}URLs:${NC}"
    echo "  - Website:    https://${DOMAIN}"
    echo "  - Admin:      https://${ADMIN_DOMAIN}"
    echo "  - API:        https://${API_DOMAIN}"
    echo ""
    echo -e "${BOLD}Admin Credentials:${NC}"
    echo "  - Email:      ${ADMIN_EMAIL}"
    if [ -n "$ADMIN_PASSWORD" ]; then
        echo "  - Password:   ${ADMIN_PASSWORD}"
        echo ""
        echo -e "${RED}⚠ IMPORTANT: Save these credentials and change the password after first login!${NC}"
    fi
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Configure DNS records pointing to your server"
    echo "  2. Set up SSL certificates (Let's Encrypt recommended)"
    echo "  3. Configure your reverse proxy"
    echo "  4. Log into the admin dashboard and change the default password"
    echo "  5. Set up Stripe webhook endpoint at https://${API_DOMAIN}/api/v1/subscriptions/webhook"
    echo ""
    echo -e "${BOLD}Configuration file saved to:${NC} ${ENV_FILE}"
    echo ""
}

#######################################
# Main
#######################################

main() {
    print_banner

    # Check prerequisites
    check_prerequisites

    # Collect environment configuration
    collect_environment_variables

    # Save environment
    save_environment

    # Select deployment target
    select_deployment_target

    # Build images
    build_docker_images

    # Deploy
    case $DEPLOY_TARGET in
        docker)
            deploy_docker_compose
            ;;
        kubernetes)
            deploy_kubernetes
            ;;
    esac

    # Show summary
    show_summary
}

# Run with command line options
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --env-only     Only configure environment, don't deploy"
        echo "  --build-only   Only build images, don't deploy"
        echo "  --deploy-only  Only deploy (assumes images are built)"
        echo ""
        exit 0
        ;;
    --env-only)
        print_banner
        check_prerequisites
        collect_environment_variables
        save_environment
        log_success "Environment configuration complete"
        ;;
    --build-only)
        print_banner
        check_prerequisites
        if ! load_existing_env; then
            log_error "No .env file found. Run without --build-only first."
            exit 1
        fi
        build_docker_images
        log_success "Image build complete"
        ;;
    --deploy-only)
        print_banner
        check_prerequisites
        if ! load_existing_env; then
            log_error "No .env file found. Run without --deploy-only first."
            exit 1
        fi
        select_deployment_target
        case $DEPLOY_TARGET in
            docker) deploy_docker_compose ;;
            kubernetes) deploy_kubernetes ;;
        esac
        show_summary
        ;;
    *)
        main
        ;;
esac
