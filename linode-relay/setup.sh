#!/bin/bash
#
# HomelabVPN iOS Relay - Docker Setup Script
# Run this on a fresh Linode VPS
#

set -e

echo "=== HomelabVPN iOS Relay Setup ==="
echo ""

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    echo "This requires sudo access..."
    curl -fsSL https://get.docker.com | sudo sh

    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "Docker installed successfully"
    echo ""
    echo "IMPORTANT: You've been added to the docker group."
    echo "Please log out and log back in, then run this script again."
    echo ""
    exit 0
else
    echo "Docker already installed"
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    echo ""
    echo "IMPORTANT: You've been added to the docker group."
    echo "Please log out and log back in, then run this script again."
    echo ""
    exit 0
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# Create directories
mkdir -p config

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from template..."
    cp .env.example .env

    echo ""
    echo "IMPORTANT: Please edit .env and set your RELAY_API_KEY"
    echo "You can get this from your HomelabVPN admin dashboard"
    echo ""
    read -p "Press Enter after updating .env, or Ctrl+C to exit..."
fi

# Verify API key is set
source .env
if [ -z "$RELAY_API_KEY" ] || [ "$RELAY_API_KEY" = "your-relay-api-key-here" ]; then
    echo "ERROR: RELAY_API_KEY is not set in .env"
    echo "Please update .env with your API key and run this script again"
    exit 1
fi

# Configure firewall
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 51820/udp
    sudo ufw --force enable
    echo "Firewall configured (SSH + WireGuard UDP)"
else
    echo "UFW not found, please configure firewall manually"
    echo "Required ports: 22/tcp (SSH), 51820/udp (WireGuard)"
fi

# Build and start containers
echo ""
echo "Building and starting containers..."
docker compose build
docker compose up -d

echo ""
echo "Waiting for WireGuard to initialize..."
sleep 20

# Show status
docker compose ps

# Get server info
PUBLIC_IP=$(curl -s ifconfig.me)
SERVER_PUBKEY=""

if [ -f config/server/publickey-server ]; then
    SERVER_PUBKEY=$(cat config/server/publickey-server)
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Server Information:"
echo "  Public IP:    ${PUBLIC_IP}"
echo "  WireGuard:    ${PUBLIC_IP}:51820/udp"
echo "  Public Key:   ${SERVER_PUBKEY:-'generating...'}"
echo ""
echo "Architecture:"
echo "  - All peers are managed through the HomelabVPN Admin UI"
echo "  - Users with platform='ios-relay' will sync to this relay"
echo "  - Sync runs every ${SYNC_INTERVAL:-60} seconds"
echo ""
echo "Next Steps:"
echo "  1. Add DNS record: ios-vpn.z-q.me -> ${PUBLIC_IP} (proxy OFF)"
echo "  2. In Admin UI, go to Peers and set platform to 'ios-relay'"
echo "     for users who need iOS access"
echo "  3. Users will receive their config from the main VPN service"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "To check sync status:"
echo "  docker compose logs peer-sync"
echo ""
echo "============================================"
