#!/bin/bash
set -e

echo "=== HomelabVPN WireGuard Server Starting ==="

# Configuration
WG_INTERFACE="${WIREGUARD_INTERFACE:-wg0}"
WG_PORT="${WIREGUARD_PORT:-51820}"
WG_ADDRESS="${SERVER_ADDRESS:-10.100.0.1/24}"
WG_DNS="${DNS_SERVERS:-1.1.1.1,8.8.8.8}"
WG_CONFIG="/etc/wireguard/${WG_INTERFACE}.conf"

# Generate or use provided keys
if [ -z "$SERVER_PRIVATE_KEY" ]; then
    echo "Generating new WireGuard keys..."
    SERVER_PRIVATE_KEY=$(wg genkey)
    SERVER_PUBLIC_KEY=$(echo "$SERVER_PRIVATE_KEY" | wg pubkey)
    echo "Generated public key: $SERVER_PUBLIC_KEY"
else
    echo "Using provided server keys"
    if [ -z "$SERVER_PUBLIC_KEY" ]; then
        SERVER_PUBLIC_KEY=$(echo "$SERVER_PRIVATE_KEY" | wg pubkey)
    fi
fi

# Export public key for health endpoint
export SERVER_PUBLIC_KEY

# Create WireGuard configuration
echo "Creating WireGuard configuration..."
cat > "$WG_CONFIG" << EOF
[Interface]
PrivateKey = ${SERVER_PRIVATE_KEY}
Address = ${WG_ADDRESS}
ListenPort = ${WG_PORT}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = false
EOF

chmod 600 "$WG_CONFIG"

# Enable IP forwarding (should be done by init container, but just in case)
echo "Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 2>/dev/null || echo "IP forwarding may already be enabled"
sysctl -w net.ipv4.conf.all.src_valid_mark=1 2>/dev/null || true

# Start WireGuard interface
echo "Starting WireGuard interface ${WG_INTERFACE}..."
wg-quick up "$WG_INTERFACE"

echo "WireGuard interface is up:"
wg show "$WG_INTERFACE"

# Start the health server in the background
echo "Starting health server on port ${HEALTH_PORT:-9090}..."
python3 /app/health-server.py &

# Keep the container running and monitor WireGuard
echo "=== WireGuard VPN Server Ready ==="
echo "Public Key: $SERVER_PUBLIC_KEY"
echo "Listening on port: $WG_PORT/UDP"
echo "Server address: $WG_ADDRESS"

# Monitor loop - keep container alive and log stats periodically
while true; do
    sleep 60
    echo "--- WireGuard Status ---"
    wg show "$WG_INTERFACE" 2>/dev/null || echo "Interface check failed"
done
