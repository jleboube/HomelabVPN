# HomelabVPN iOS Relay

This directory contains the Docker Compose setup for running a WireGuard relay on a Linode VPS for iOS users.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HomelabVPN Admin UI                       │
│                   (Single Source of Truth)                   │
│                                                              │
│  Peers Page: Set platform = "ios-relay" for iOS users       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    HomelabVPN Backend API                    │
│                                                              │
│  GET /api/relay/v1/peers  (returns ios-relay peers only)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Linode iOS Relay                          │
│                                                              │
│  peer-sync: Syncs peers from API → configures WireGuard     │
│  wireguard: Runs WireGuard server for iOS clients           │
└─────────────────────────────────────────────────────────────┘
```

## Why a Relay?

iOS devices cannot use the wstunnel UDP-over-WebSocket approach required for Cloudflare Tunnel proxying. This relay provides direct UDP access for iOS users.

## Quick Start

1. **Create a Linode Nanode** ($5/month, 1GB RAM)
   - Image: Ubuntu 24.04 LTS
   - Region: Choose closest to your users

2. **SSH into your Linode and clone the files:**
   ```bash
   mkdir -p ~/homelabvpn-relay
   cd ~/homelabvpn-relay
   # Copy the files from this directory
   ```

3. **Configure and run:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Update `.env` with your API key:**
   ```
   RELAY_API_KEY=your-api-key-from-admin
   ```

5. **Configure DNS (Cloudflare):**
   - Type: A
   - Name: `ios-vpn`
   - Content: `<linode-ip>`
   - Proxy: OFF (grey cloud - DNS only)

6. **In Admin UI, set user platforms:**
   - Go to Peers page
   - Set platform to `ios-relay` for users who need iOS access

## Files

- `docker-compose.yml` - Docker Compose configuration
- `Dockerfile.sync` - Dockerfile for the sync service
- `sync.sh` - Script that syncs peers from main API
- `setup.sh` - Initial setup script
- `.env.example` - Example environment configuration

## Services

1. **wireguard** - WireGuard VPN server (linuxserver image)
2. **peer-sync** - Syncs peers from main HomelabVPN API

## Management Commands

```bash
# View all logs
docker compose logs -f

# View sync service logs
docker compose logs -f peer-sync

# Restart services
docker compose restart

# Stop all services
docker compose down

# Update and restart
docker compose pull
docker compose build
docker compose up -d
```

## API Endpoints Used

The relay uses these endpoints on the main API:

- `POST /api/relay/v1/register` - Register relay with main API
- `POST /api/relay/v1/heartbeat` - Send status updates
- `GET /api/relay/v1/peers` - Fetch peer configurations (ios-relay platform only)

## iOS Client Setup

Once a user's platform is set to `ios-relay` in the Admin UI:

1. User downloads their WireGuard config from the main app
2. Config will include the iOS relay endpoint
3. User imports config into iOS WireGuard app

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RELAY_API_KEY` | API key for main API auth | (required) |
| `API_URL` | Main API URL | `https://api-vpn.z-q.me` |
| `RELAY_NAME` | Relay identifier | `ios-relay-1` |
| `RELAY_REGION` | Relay region | `us-east` |
| `SERVER_URL` | Hostname for client configs | `ios-vpn.z-q.me` |
| `SYNC_INTERVAL` | Seconds between syncs | `60` |

## Security Notes

- The API key should be kept secret
- The relay only accepts peers from the main API
- All peer management is done through the Admin UI
