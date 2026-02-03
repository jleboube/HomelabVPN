#!/bin/bash

#######################################
# HomelabVPN Environment Validation Script
# Validates that all required environment variables are set
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${1:-$PROJECT_ROOT/.env}"

# Required variables for basic functionality
REQUIRED_VARS=(
    "DOMAIN"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "ADMIN_JWT_SECRET"
)

# Required for full functionality
OPTIONAL_IMPORTANT_VARS=(
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
)

# All variables to check
ALL_VARS=(
    "DOMAIN"
    "POSTGRES_HOST"
    "POSTGRES_PORT"
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "REDIS_HOST"
    "REDIS_PORT"
    "JWT_SECRET"
    "ADMIN_JWT_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "ADMIN_EMAIL"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "HomelabVPN Environment Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load environment file if exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✓${NC} Found environment file: $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo -e "${RED}✗${NC} Environment file not found: $ENV_FILE"
    echo ""
    echo "Run the deployment script to create one:"
    echo "  ./scripts/deploy.sh"
    echo ""
    echo "Or copy the example:"
    echo "  cp .env.example .env"
    exit 1
fi

echo ""
echo "Checking required variables..."

missing_required=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "  ${RED}✗${NC} $var is not set"
        missing_required+=("$var")
    else
        # Mask secrets
        if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"PASSWORD"* ]]; then
            echo -e "  ${GREEN}✓${NC} $var = ****"
        else
            echo -e "  ${GREEN}✓${NC} $var = ${!var}"
        fi
    fi
done

echo ""
echo "Checking optional but important variables..."

missing_optional=()
for var in "${OPTIONAL_IMPORTANT_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "  ${YELLOW}!${NC} $var is not set"
        missing_optional+=("$var")
    else
        if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]]; then
            echo -e "  ${GREEN}✓${NC} $var = ****"
        else
            echo -e "  ${GREEN}✓${NC} $var = ${!var}"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validation checks
errors=()

# Check JWT secrets length
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -lt 32 ]; then
    errors+=("JWT_SECRET should be at least 32 characters")
fi

if [ -n "$ADMIN_JWT_SECRET" ] && [ ${#ADMIN_JWT_SECRET} -lt 32 ]; then
    errors+=("ADMIN_JWT_SECRET should be at least 32 characters")
fi

# Check Stripe keys format
if [ -n "$STRIPE_SECRET_KEY" ] && [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_ ]]; then
    errors+=("STRIPE_SECRET_KEY should start with 'sk_'")
fi

if [ -n "$STRIPE_PUBLISHABLE_KEY" ] && [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_ ]]; then
    errors+=("STRIPE_PUBLISHABLE_KEY should start with 'pk_'")
fi

# Check domain format
if [ -n "$DOMAIN" ] && [[ "$DOMAIN" =~ ^https?:// ]]; then
    errors+=("DOMAIN should not include protocol (remove https://)")
fi

# Print validation errors
if [ ${#errors[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Validation Errors:${NC}"
    for error in "${errors[@]}"; do
        echo -e "  ${RED}✗${NC} $error"
    done
fi

# Summary
echo ""
if [ ${#missing_required[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing required variables: ${missing_required[*]}${NC}"
    echo "  Run ./scripts/deploy.sh to configure these"
    exit 1
elif [ ${#missing_optional[@]} -gt 0 ]; then
    echo -e "${YELLOW}! Some optional features will be disabled${NC}"
    echo "  Missing: ${missing_optional[*]}"
    echo ""
    echo -e "${GREEN}✓ Basic configuration is valid${NC}"
    exit 0
else
    echo -e "${GREEN}✓ All variables are properly configured${NC}"
    exit 0
fi
