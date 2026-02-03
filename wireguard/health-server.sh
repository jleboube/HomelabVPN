#!/bin/bash
# Simple HTTP health server for WireGuard

HEALTH_PORT="${HEALTH_PORT:-9090}"
WG_INTERFACE="${WIREGUARD_INTERFACE:-wg0}"

echo "Health server listening on port $HEALTH_PORT"

# Create a simple HTTP server using netcat/socat alternative with bash
while true; do
    # Use a named pipe for request handling
    PIPE=$(mktemp -u)
    mkfifo "$PIPE"

    # Listen for incoming connections
    {
        read -r REQUEST < "$PIPE"

        # Parse the request path
        PATH_REQUESTED=$(echo "$REQUEST" | awk '{print $2}')

        case "$PATH_REQUESTED" in
            /health)
                # Check if WireGuard interface is up
                if ip link show "$WG_INTERFACE" > /dev/null 2>&1; then
                    RESPONSE='{"status":"healthy","interface":"'"$WG_INTERFACE"'"}'
                    HTTP_STATUS="200 OK"
                else
                    RESPONSE='{"status":"unhealthy","error":"interface down"}'
                    HTTP_STATUS="503 Service Unavailable"
                fi
                ;;
            /ready)
                # Check if WireGuard is accepting connections
                if wg show "$WG_INTERFACE" > /dev/null 2>&1; then
                    RESPONSE='{"status":"ready"}'
                    HTTP_STATUS="200 OK"
                else
                    RESPONSE='{"status":"not ready"}'
                    HTTP_STATUS="503 Service Unavailable"
                fi
                ;;
            /metrics)
                # Get WireGuard stats
                PEERS=$(wg show "$WG_INTERFACE" peers 2>/dev/null | wc -l)
                TRANSFER_RX=$(wg show "$WG_INTERFACE" transfer 2>/dev/null | awk '{sum+=$2} END {print sum+0}')
                TRANSFER_TX=$(wg show "$WG_INTERFACE" transfer 2>/dev/null | awk '{sum+=$3} END {print sum+0}')

                RESPONSE="# HELP wireguard_peers Number of connected peers
# TYPE wireguard_peers gauge
wireguard_peers{interface=\"$WG_INTERFACE\"} $PEERS
# HELP wireguard_received_bytes Total bytes received
# TYPE wireguard_received_bytes counter
wireguard_received_bytes{interface=\"$WG_INTERFACE\"} $TRANSFER_RX
# HELP wireguard_sent_bytes Total bytes sent
# TYPE wireguard_sent_bytes counter
wireguard_sent_bytes{interface=\"$WG_INTERFACE\"} $TRANSFER_TX"
                HTTP_STATUS="200 OK"
                ;;
            /info)
                # Server info
                PUBLIC_KEY="${SERVER_PUBLIC_KEY:-unknown}"
                RESPONSE='{"publicKey":"'"$PUBLIC_KEY"'","interface":"'"$WG_INTERFACE"'","port":"'"${WIREGUARD_PORT:-51820}"'"}'
                HTTP_STATUS="200 OK"
                ;;
            *)
                RESPONSE='{"error":"not found"}'
                HTTP_STATUS="404 Not Found"
                ;;
        esac

        # Calculate content length
        CONTENT_LENGTH=${#RESPONSE}

        # Determine content type
        if [[ "$PATH_REQUESTED" == "/metrics" ]]; then
            CONTENT_TYPE="text/plain"
        else
            CONTENT_TYPE="application/json"
        fi

        # Send HTTP response
        printf "HTTP/1.1 %s\r\nContent-Type: %s\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" \
            "$HTTP_STATUS" "$CONTENT_TYPE" "$CONTENT_LENGTH" "$RESPONSE"

    } | nc -l -p "$HEALTH_PORT" -q 1 > "$PIPE" 2>/dev/null

    rm -f "$PIPE"
done
