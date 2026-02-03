#!/bin/bash
#
# HomelabVPN Relay Peer Sync Script
# Syncs iOS relay peer configurations from main API to local WireGuard
#

set -e

API_URL="${API_URL:-https://api-vpn.z-q.me}"
RELAY_API_KEY="${RELAY_API_KEY}"
RELAY_NAME="${RELAY_NAME:-ios-relay}"
RELAY_REGION="${RELAY_REGION:-us-east}"
SYNC_INTERVAL="${SYNC_INTERVAL:-60}"
CONFIG_DIR="/config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Get relay public key from WireGuard config
get_public_key() {
    if [ -f "${CONFIG_DIR}/server/privatekey-server" ]; then
        cat "${CONFIG_DIR}/server/privatekey-server" | wg pubkey
    else
        log_warn "Server private key not found, waiting for WireGuard to initialize..."
        return 1
    fi
}

# Get relay public IP
get_public_ip() {
    curl -s --connect-timeout 5 ifconfig.me || curl -s --connect-timeout 5 icanhazip.com || echo "unknown"
}

# Register relay with main API
register_relay() {
    local public_key=$(get_public_key)
    local public_ip=$(get_public_ip)

    if [ -z "$public_key" ] || [ "$public_ip" = "unknown" ]; then
        log_error "Could not get public key or IP"
        return 1
    fi

    log "Registering relay with API..."
    log "  Name: ${RELAY_NAME}"
    log "  Region: ${RELAY_REGION}"
    log "  IP: ${public_ip}"
    log "  Public Key: ${public_key:0:20}..."

    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Relay-API-Key: ${RELAY_API_KEY}" \
        -d "{
            \"name\": \"${RELAY_NAME}\",
            \"publicIP\": \"${public_ip}\",
            \"publicKey\": \"${public_key}\",
            \"region\": \"${RELAY_REGION}\",
            \"type\": \"ios-relay\"
        }" \
        "${API_URL}/api/relay/v1/register" 2>/dev/null)

    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        log_success "Relay registered successfully"
        return 0
    else
        log_error "Failed to register relay (HTTP ${http_code}): ${body}"
        return 1
    fi
}

# Send heartbeat to main API
send_heartbeat() {
    local public_ip=$(get_public_ip)
    local active_peers=$(wg show wg0 peers 2>/dev/null | wc -l || echo "0")
    local bytes_in=$(wg show wg0 transfer 2>/dev/null | awk '{sum+=$2} END {print sum+0}' || echo "0")
    local bytes_out=$(wg show wg0 transfer 2>/dev/null | awk '{sum+=$3} END {print sum+0}' || echo "0")
    local uptime=$(cat /proc/uptime | cut -d' ' -f1 | cut -d'.' -f1)

    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Relay-API-Key: ${RELAY_API_KEY}" \
        -d "{
            \"publicIP\": \"${public_ip}\",
            \"activePeers\": ${active_peers},
            \"bytesIn\": ${bytes_in},
            \"bytesOut\": ${bytes_out},
            \"uptime\": ${uptime}
        }" \
        "${API_URL}/api/relay/v1/heartbeat" 2>/dev/null)

    local http_code=$(echo "$response" | tail -1)

    if [ "$http_code" = "200" ]; then
        log "Heartbeat sent (${active_peers} peers, ${bytes_in}B in, ${bytes_out}B out)"
        return 0
    else
        log_warn "Heartbeat failed (HTTP ${http_code})"
        return 1
    fi
}

# Fetch peers from main API
fetch_peers() {
    local response=$(curl -s -w "\n%{http_code}" \
        -H "X-Relay-API-Key: ${RELAY_API_KEY}" \
        "${API_URL}/api/relay/v1/peers" 2>/dev/null)

    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo "$body"
        return 0
    else
        log_error "Failed to fetch peers (HTTP ${http_code})"
        return 1
    fi
}

# Update WireGuard peers
update_peers() {
    local peers_json="$1"

    if [ -z "$peers_json" ]; then
        log_warn "No peers data received"
        return 1
    fi

    # Check if peers array exists and get count
    local peer_count=$(echo "$peers_json" | jq -r '.peers | length // 0' 2>/dev/null)

    if [ "$peer_count" = "0" ] || [ -z "$peer_count" ]; then
        log "No iOS relay peers configured in admin UI yet"
        log "  -> Go to Admin UI > Peers and set platform to 'ios-relay' for users who need iOS access"
        return 0
    fi

    log "Syncing ${peer_count} peers..."

    # Get current peers from WireGuard
    local current_peers=$(wg show wg0 peers 2>/dev/null || echo "")

    # Track which peers we've processed (to remove stale ones)
    local processed_peers=""

    # Process each peer from API
    echo "$peers_json" | jq -c '.peers[]?' 2>/dev/null | while read -r peer; do
        local public_key=$(echo "$peer" | jq -r '.publicKey')
        local client_ip=$(echo "$peer" | jq -r '.clientIP')
        local active=$(echo "$peer" | jq -r '.active')
        local email=$(echo "$peer" | jq -r '.email // "unknown"')

        if [ -z "$public_key" ] || [ "$public_key" = "null" ]; then
            continue
        fi

        # Only add active peers
        if [ "$active" = "true" ]; then
            # Check if peer already exists
            if echo "$current_peers" | grep -q "$public_key"; then
                # Peer exists, check if IP changed
                local current_allowed=$(wg show wg0 allowed-ips 2>/dev/null | grep "$public_key" | awk '{print $2}')
                if [ "$current_allowed" != "${client_ip}/32" ]; then
                    log "Updating peer ${email} (${public_key:0:8}...) -> ${client_ip}"
                    wg set wg0 peer "$public_key" allowed-ips "${client_ip}/32"
                fi
            else
                # Add new peer
                log "Adding peer ${email} (${public_key:0:8}...) -> ${client_ip}"
                wg set wg0 peer "$public_key" allowed-ips "${client_ip}/32"
            fi
        else
            # Remove inactive peer if it exists
            if echo "$current_peers" | grep -q "$public_key"; then
                log "Removing inactive peer ${email} (${public_key:0:8}...)"
                wg set wg0 peer "$public_key" remove
            fi
        fi
    done

    log_success "Peer sync complete"
}

# Main sync function
sync() {
    log "Starting peer sync..."

    local peers=$(fetch_peers)
    if [ $? -eq 0 ] && [ -n "$peers" ]; then
        update_peers "$peers"
    fi

    send_heartbeat
}

# Wait for WireGuard to be ready
wait_for_wireguard() {
    log "Waiting for WireGuard to be ready..."
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if wg show wg0 &>/dev/null; then
            log_success "WireGuard interface wg0 is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        log "Waiting for wg0... (attempt ${attempt}/${max_attempts})"
        sleep 2
    done

    log_error "WireGuard not ready after ${max_attempts} attempts"
    return 1
}

# Main loop
main() {
    log "========================================"
    log "HomelabVPN iOS Relay Sync Service"
    log "========================================"
    log "API URL: ${API_URL}"
    log "Relay Name: ${RELAY_NAME}"
    log "Relay Region: ${RELAY_REGION}"
    log "Sync Interval: ${SYNC_INTERVAL}s"
    log ""

    # Validate API key
    if [ -z "${RELAY_API_KEY}" ]; then
        log_error "RELAY_API_KEY is not set!"
        log_error "Please set RELAY_API_KEY in your .env file"
        exit 1
    fi

    # Wait for WireGuard
    wait_for_wireguard || exit 1

    # Initial registration
    register_relay || log_warn "Initial registration failed, will retry..."

    # Initial sync
    sync

    log ""
    log "Starting sync loop (every ${SYNC_INTERVAL}s)..."
    log ""

    # Main sync loop
    while true; do
        sleep "${SYNC_INTERVAL}"
        sync
    done
}

main "$@"
