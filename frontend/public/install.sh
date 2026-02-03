#!/bin/bash
#
# HomelabVPN Quick Install Script
# Usage: curl -fsSL https://vpn.z-q.me/install.sh | bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPN_SERVER="us-vpn.z-q.me"
API_URL="https://api-vpn.z-q.me"
WSTUNNEL_VERSION="10.5.1"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║       HomelabVPN Quick Installer       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
OS="unknown"
ARCH=$(uname -m)
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    [[ "$ARCH" == "arm64" ]] && ARCH="arm64" || ARCH="amd64"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    [[ "$ARCH" == "x86_64" ]] && ARCH="amd64"
    [[ "$ARCH" == "aarch64" ]] && ARCH="arm64"
else
    echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Detected: $OS ($ARCH)"

# Check for required tools
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ Required tool not found: $1${NC}"
        return 1
    fi
    return 0
}

echo -e "\n${BLUE}Checking dependencies...${NC}"

# Check for WireGuard
if ! check_command wg; then
    echo -e "${YELLOW}WireGuard not found. Installing...${NC}"
    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install wireguard-tools
        else
            echo -e "${RED}Please install Homebrew first: https://brew.sh${NC}"
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y wireguard-tools
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y wireguard-tools
        elif command -v pacman &> /dev/null; then
            sudo pacman -S wireguard-tools
        else
            echo -e "${RED}Please install WireGuard manually${NC}"
            exit 1
        fi
    fi
fi
echo -e "${GREEN}✓${NC} WireGuard installed"

# Install wstunnel
WSTUNNEL_BIN="/usr/local/bin/wstunnel"
if [[ ! -f "$WSTUNNEL_BIN" ]] || ! $WSTUNNEL_BIN --version &>/dev/null; then
    echo -e "${YELLOW}Installing wstunnel...${NC}"

    WSTUNNEL_URL="https://github.com/erebe/wstunnel/releases/download/v${WSTUNNEL_VERSION}/wstunnel_${WSTUNNEL_VERSION}_${OS}_${ARCH}.tar.gz"

    TMP_DIR=$(mktemp -d)
    curl -fsSL "$WSTUNNEL_URL" -o "$TMP_DIR/wstunnel.tar.gz"
    tar -xzf "$TMP_DIR/wstunnel.tar.gz" -C "$TMP_DIR"

    if [[ "$OS" == "macos" ]]; then
        sudo mv "$TMP_DIR/wstunnel" "$WSTUNNEL_BIN"
    else
        sudo mv "$TMP_DIR/wstunnel" "$WSTUNNEL_BIN"
    fi
    sudo chmod +x "$WSTUNNEL_BIN"
    rm -rf "$TMP_DIR"
fi
echo -e "${GREEN}✓${NC} wstunnel installed"

# Create config directory
CONFIG_DIR="$HOME/.homelabvpn"
mkdir -p "$CONFIG_DIR"

# Generate WireGuard keys if not exist
if [[ ! -f "$CONFIG_DIR/privatekey" ]]; then
    echo -e "\n${BLUE}Generating WireGuard keys...${NC}"
    wg genkey | tee "$CONFIG_DIR/privatekey" | wg pubkey > "$CONFIG_DIR/publickey"
    chmod 600 "$CONFIG_DIR/privatekey"
fi

PRIVATE_KEY=$(cat "$CONFIG_DIR/privatekey")
PUBLIC_KEY=$(cat "$CONFIG_DIR/publickey")
echo -e "${GREEN}✓${NC} Keys generated"
echo -e "  Your public key: ${YELLOW}$PUBLIC_KEY${NC}"

# Create connection script
cat > "$CONFIG_DIR/connect.sh" << 'SCRIPT'
#!/bin/bash
# HomelabVPN Connection Script

CONFIG_DIR="$HOME/.homelabvpn"
VPN_SERVER="us-vpn.z-q.me"
LOCAL_PORT=51820

# Check if already running
if pgrep -f "wstunnel.*$VPN_SERVER" > /dev/null; then
    echo "VPN tunnel already running"
    exit 0
fi

echo "Starting VPN tunnel to $VPN_SERVER..."

# Start wstunnel in background
wstunnel client \
    --udp \
    -L "udp://127.0.0.1:${LOCAL_PORT}:127.0.0.1:51820" \
    "wss://${VPN_SERVER}" &

WSTUNNEL_PID=$!
echo $WSTUNNEL_PID > "$CONFIG_DIR/wstunnel.pid"

sleep 2

if kill -0 $WSTUNNEL_PID 2>/dev/null; then
    echo "✓ Tunnel established (PID: $WSTUNNEL_PID)"

    # Bring up WireGuard
    if [[ -f "$CONFIG_DIR/wg0.conf" ]]; then
        sudo wg-quick up "$CONFIG_DIR/wg0.conf"
        echo "✓ VPN connected!"
    else
        echo "⚠ WireGuard config not found. Please register at https://vpn.z-q.me"
    fi
else
    echo "✗ Failed to establish tunnel"
    exit 1
fi
SCRIPT
chmod +x "$CONFIG_DIR/connect.sh"

# Create disconnect script
cat > "$CONFIG_DIR/disconnect.sh" << 'SCRIPT'
#!/bin/bash
# HomelabVPN Disconnect Script

CONFIG_DIR="$HOME/.homelabvpn"

echo "Disconnecting VPN..."

# Stop WireGuard
if [[ -f "$CONFIG_DIR/wg0.conf" ]]; then
    sudo wg-quick down "$CONFIG_DIR/wg0.conf" 2>/dev/null || true
fi

# Stop wstunnel
if [[ -f "$CONFIG_DIR/wstunnel.pid" ]]; then
    PID=$(cat "$CONFIG_DIR/wstunnel.pid")
    kill $PID 2>/dev/null || true
    rm "$CONFIG_DIR/wstunnel.pid"
fi

# Kill any remaining wstunnel processes
pkill -f "wstunnel.*us-vpn.z-q.me" 2>/dev/null || true

echo "✓ VPN disconnected"
SCRIPT
chmod +x "$CONFIG_DIR/disconnect.sh"

# Create status script
cat > "$CONFIG_DIR/status.sh" << 'SCRIPT'
#!/bin/bash
# HomelabVPN Status Script

echo "=== HomelabVPN Status ==="

# Check wstunnel
if pgrep -f "wstunnel.*us-vpn.z-q.me" > /dev/null; then
    echo "Tunnel:    ✓ Connected"
else
    echo "Tunnel:    ✗ Disconnected"
fi

# Check WireGuard
if ip link show wg0 &>/dev/null || ifconfig wg0 &>/dev/null 2>&1; then
    echo "WireGuard: ✓ Active"
    echo ""
    sudo wg show wg0 2>/dev/null || true
else
    echo "WireGuard: ✗ Inactive"
fi
SCRIPT
chmod +x "$CONFIG_DIR/status.sh"

# Add aliases to shell profile
SHELL_RC="$HOME/.bashrc"
[[ "$SHELL" == *"zsh"* ]] && SHELL_RC="$HOME/.zshrc"

if ! grep -q "homelabvpn" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# HomelabVPN aliases" >> "$SHELL_RC"
    echo "alias vpn-connect='$CONFIG_DIR/connect.sh'" >> "$SHELL_RC"
    echo "alias vpn-disconnect='$CONFIG_DIR/disconnect.sh'" >> "$SHELL_RC"
    echo "alias vpn-status='$CONFIG_DIR/status.sh'" >> "$SHELL_RC"
fi

echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Installation complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Sign in at ${YELLOW}https://vpn.z-q.me${NC} to register your device"
echo "2. Your public key to register: ${YELLOW}$PUBLIC_KEY${NC}"
echo ""
echo -e "${BLUE}Quick commands (restart your terminal first):${NC}"
echo "  ${YELLOW}vpn-connect${NC}    - Connect to VPN"
echo "  ${YELLOW}vpn-disconnect${NC} - Disconnect from VPN"
echo "  ${YELLOW}vpn-status${NC}     - Check connection status"
echo ""
echo -e "Config location: ${YELLOW}$CONFIG_DIR${NC}"
