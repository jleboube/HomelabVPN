#!/bin/bash

#######################################
# HomelabVPN Quick Setup Script
# Makes all scripts executable and runs initial setup
#######################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          HomelabVPN Quick Setup                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Make all scripts executable
echo "Making scripts executable..."
chmod +x "$SCRIPT_DIR"/*.sh
echo "✓ Scripts are now executable"
echo ""

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "No .env file found."
    echo ""
    echo "Options:"
    echo "  1) Run interactive deployment (recommended)"
    echo "  2) Copy example and edit manually"
    echo ""
    read -p "Select option [1-2]: " choice

    case $choice in
        1)
            exec "$SCRIPT_DIR/deploy.sh"
            ;;
        2)
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            echo ""
            echo "Created .env from template."
            echo "Edit $PROJECT_ROOT/.env with your configuration"
            echo "Then run: ./scripts/deploy.sh"
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
else
    echo ".env file found."
    echo ""
    echo "Available commands:"
    echo "  ./scripts/deploy.sh    - Deploy or redeploy"
    echo "  ./scripts/upgrade.sh   - Upgrade to latest version"
    echo "  ./scripts/status.sh    - Check service status"
    echo "  ./scripts/logs.sh      - View logs"
    echo "  ./scripts/validate-env.sh - Validate configuration"
    echo ""
fi
