# WireGuard VPN Server for HomelabVPN
FROM alpine:3.19

# Install WireGuard and dependencies
RUN apk add --no-cache \
    wireguard-tools \
    iptables \
    ip6tables \
    iproute2 \
    curl \
    bash \
    jq \
    openssl \
    python3 \
    && rm -rf /var/cache/apk/*

# Create directories
RUN mkdir -p /etc/wireguard /app

# Copy scripts
COPY entrypoint.sh /app/entrypoint.sh
COPY health-server.py /app/health-server.py

RUN chmod +x /app/entrypoint.sh /app/health-server.py

# Environment variables
ENV WIREGUARD_INTERFACE=wg0
ENV WIREGUARD_PORT=51820
ENV SERVER_PRIVATE_KEY=""
ENV SERVER_PUBLIC_KEY=""
ENV SERVER_ADDRESS=10.100.0.1/24
ENV DNS_SERVERS=1.1.1.1,8.8.8.8
ENV ALLOWED_IPS=0.0.0.0/0
ENV HEALTH_PORT=9090

# Expose ports
EXPOSE 51820/udp
EXPOSE 9090/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:9090/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
