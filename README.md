# HomelabVPN

**Website:** https://vpn.z-q.me

A privacy-focused WireGuard VPN service with an animated landing page, Stripe payments, Google OAuth, and Kubernetes deployment with auto-scaling.

## Features

- **Modern Landing Page**: Animated with Framer Motion, responsive design
- **WireGuard Protocol**: Fast, modern, secure VPN protocol
- **Zero-Knowledge Architecture**: No activity logs, minimal data retention
- **One-Click Install**: Native macOS/iOS configuration profiles
- **Auto-Scaling**: Kubernetes HPA for dynamic scaling
- **Stripe Integration**: Subscription management with multiple billing periods
- **Google OAuth**: Passwordless authentication

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
│                     https://vpn.z-q.me                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Ingress (nginx)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                    │                    │                        │
│                    ▼                    ▼                        │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │   Frontend (Next.js) │    │   API (Go/Gin)      │             │
│  │   - Landing Page     │    │   - Auth            │             │
│  │   - Dashboard        │◄──►│   - Subscriptions   │             │
│  │   - Pricing          │    │   - VPN Config      │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                       │                          │
│                    ┌──────────────────┼──────────────────┐       │
│                    ▼                  ▼                  ▼       │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL        │  │   Redis         │  │  WireGuard   │ │
│  │   - Users           │  │   - Sessions    │  │  - VPN Pods  │ │
│  │   - Subscriptions   │  │   - Rate Limit  │  │  - HPA Scale │ │
│  └─────────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Domain Structure

| Domain | Purpose |
|--------|---------|
| `vpn.z-q.me` | Main website & dashboard |
| `api.vpn.z-q.me` | Backend API |
| `admin.vpn.z-q.me` | Admin dashboard |
| `us-east.vpn.z-q.me` | US East VPN server |
| `us-west.vpn.z-q.me` | US West VPN server |
| `uk.vpn.z-q.me` | UK VPN server |
| `de.vpn.z-q.me` | Germany VPN server |
| `nl.vpn.z-q.me` | Netherlands VPN server |
| `jp.vpn.z-q.me` | Japan VPN server |
| `sg.vpn.z-q.me` | Singapore VPN server |
| `au.vpn.z-q.me` | Australia VPN server |
| `ca.vpn.z-q.me` | Canada VPN server |
| `fr.vpn.z-q.me` | France VPN server |

## Pricing Tiers

| Plan  | Daily | Monthly | Yearly | Features |
|-------|-------|---------|--------|----------|
| Basic | $2    | $10     | $80    | 1 location, 3 devices, Email support |
| Pro   | $4    | $15     | $120   | 10+ locations, Unlimited devices, Priority support |

## Quick Start

### Prerequisites

- Docker & Docker Compose (v2.0+)
- OpenSSL (for secret generation)
- kubectl (for Kubernetes deployment)

### One-Command Deployment

The easiest way to deploy HomelabVPN is using the interactive deployment script:

```bash
# Clone the repository
git clone https://github.com/yourusername/homelabvpn.git
cd homelabvpn

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will:
1. Check prerequisites
2. Prompt for all required configuration
3. Generate secure secrets
4. Build Docker images
5. Deploy to Docker Compose or Kubernetes

### Manual Configuration

If you prefer manual setup:

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env

# Deploy
./scripts/deploy.sh
```

### Local Development

```bash
# Start only database services
docker-compose up -d postgres redis

# Run backend
cd backend && go run ./cmd/api

# Run frontend (in another terminal)
cd frontend && npm install && npm run dev

# Run admin (in another terminal)
cd admin && npm install && npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Admin Dashboard: http://localhost:3001
- API: http://localhost:8080
- Prometheus Metrics: http://localhost:8080/metrics

## Production Deployment

### Interactive Deployment (Recommended)

```bash
./scripts/deploy.sh
```

The script will guide you through:
- Domain configuration
- Database credentials
- Security secrets (auto-generated if desired)
- Google OAuth setup
- Stripe payment integration
- Deployment target (Docker Compose or Kubernetes)

### DNS Configuration

Point the following DNS records to your server:

```
vpn.z-q.me          A     <server-ip>
api.vpn.z-q.me      A     <server-ip>
admin.vpn.z-q.me    A     <server-ip>
us-east.vpn.z-q.me  A     <vpn-server-ip>
us-west.vpn.z-q.me  A     <vpn-server-ip>
uk.vpn.z-q.me       A     <vpn-server-ip>
de.vpn.z-q.me       A     <vpn-server-ip>
nl.vpn.z-q.me       A     <vpn-server-ip>
jp.vpn.z-q.me       A     <vpn-server-ip>
sg.vpn.z-q.me       A     <vpn-server-ip>
au.vpn.z-q.me       A     <vpn-server-ip>
ca.vpn.z-q.me       A     <vpn-server-ip>
fr.vpn.z-q.me       A     <vpn-server-ip>
```

### Docker Compose Deployment

```bash
./scripts/deploy.sh  # Select "Docker Compose"
```

This deploys all services locally. Configure a reverse proxy (nginx/traefik) for SSL termination.

### Kubernetes Deployment

```bash
./scripts/deploy.sh  # Select "Kubernetes"
```

For manual Kubernetes deployment:

```bash
# Apply namespace and base resources
kubectl apply -f kubernetes/namespace.yaml

# Create secrets
kubectl create secret generic homelabvpn-secrets \
  --namespace=homelabvpn \
  --from-literal=DATABASE_URL="..." \
  --from-literal=JWT_SECRET="..."

# Deploy all resources
kubectl apply -f kubernetes/
```

4. **Check deployment status:**
   ```bash
   kubectl get pods -n homelabvpn
   kubectl get hpa -n homelabvpn
   ```

## API Endpoints

Base URL: `https://api.vpn.z-q.me`

### Authentication
- `GET /api/v1/auth/google/start` - Start Google OAuth
- `POST /api/v1/auth/google/callback` - OAuth callback
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### VPN
- `GET /api/v1/vpn/config` - Download WireGuard config
- `POST /api/v1/vpn/config/regenerate` - Regenerate keys
- `GET /api/v1/vpn/servers` - List server locations

### Subscriptions
- `GET /api/v1/subscriptions/plans` - List plans
- `POST /api/v1/subscriptions/checkout` - Create Stripe checkout
- `POST /api/v1/subscriptions/webhook` - Stripe webhooks
- `GET /api/v1/subscriptions/current` - Current subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Admin API
Base URL: `https://api.vpn.z-q.me/api/admin/v1`

#### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/refresh` - Refresh token
- `POST /logout` - Admin logout

#### Dashboard
- `GET /dashboard/stats` - Dashboard statistics
- `GET /dashboard/health` - System health metrics
- `GET /dashboard/bandwidth` - Bandwidth history
- `GET /dashboard/user-growth` - User growth data
- `GET /dashboard/revenue` - Revenue statistics

#### User Management
- `GET /users` - List users (with pagination & filters)
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Subscription Management
- `GET /subscriptions` - List subscriptions
- `PUT /subscriptions/:id` - Update subscription
- `POST /subscriptions/:id/cancel` - Cancel subscription

#### Server Management
- `GET /servers` - List VPN servers
- `PUT /servers/:id` - Update server

#### Audit
- `GET /audit-logs` - Admin audit logs

## Configuration Files

### WireGuard Config (macOS/Linux)
Download from dashboard → Import into WireGuard app

### iOS mobileconfig
Download `.mobileconfig` → Open on iOS → Install profile

## Security Features

- **TLS 1.3+**: All API communications encrypted
- **JWT Tokens**: 15-minute expiration with refresh tokens
- **AES-256-GCM**: Encrypted key storage
- **Rate Limiting**: Redis-backed request limiting
- **Network Policies**: Pod-to-pod isolation
- **Security Scanning**: Trivy container scanning

## Deployment Scripts

HomelabVPN includes a suite of management scripts:

| Script | Description |
|--------|-------------|
| `./scripts/setup.sh` | Initial setup and make scripts executable |
| `./scripts/deploy.sh` | Interactive deployment wizard |
| `./scripts/upgrade.sh` | Pull updates and redeploy |
| `./scripts/status.sh` | Check health of all services |
| `./scripts/logs.sh` | View service logs |
| `./scripts/validate-env.sh` | Validate environment configuration |

### Script Usage Examples

```bash
# Initial deployment
./scripts/setup.sh

# Check service status
./scripts/status.sh

# View API logs (follow mode)
./scripts/logs.sh api -f

# View all logs from last hour
./scripts/logs.sh all --since 1h

# Upgrade to latest version
./scripts/upgrade.sh

# Validate configuration without deploying
./scripts/deploy.sh --env-only

# Build images only
./scripts/deploy.sh --build-only

# Deploy with existing images
./scripts/deploy.sh --deploy-only
```

## Monitoring

The application exposes Prometheus metrics at `/metrics`:

- `homelabvpn_http_requests_total`
- `homelabvpn_http_request_duration_seconds`
- `homelabvpn_active_connections`
- `homelabvpn_bandwidth_bytes_total`
- `homelabvpn_active_subscriptions`

## Admin Dashboard

The admin dashboard provides comprehensive observability and management capabilities:

### Features
- **Real-time Metrics**: CPU, memory, disk, and network usage
- **User Management**: Full CRUD operations on users
- **Subscription Management**: View, update, and cancel subscriptions
- **Server Monitoring**: Real-time VPN server status and metrics
- **Revenue Analytics**: MRR, ARR, churn rate, and breakdowns
- **Audit Logs**: Track all admin actions

### Access
- **URL**: https://admin.vpn.z-q.me
- **Default Admin**: admin@vpn.z-q.me / admin123 (Change immediately in production!)

### Admin Roles
- `super_admin`: Full access to all features
- `admin`: Can modify users and subscriptions
- `viewer`: Read-only access

## Project Structure

```
homelabvpn/
├── frontend/                 # Next.js 14 + Framer Motion (User)
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities
├── admin/                    # Next.js Admin Dashboard
│   ├── app/                 # Admin pages
│   ├── components/          # Admin components
│   ├── hooks/               # React hooks
│   └── lib/                 # API client
├── backend/                  # Go API server
│   ├── cmd/api/             # Entry point
│   └── internal/
│       ├── admin/           # Admin auth & handlers
│       ├── api/             # User API handlers
│       ├── auth/            # OAuth & JWT
│       ├── db/              # Database schema
│       ├── metrics/         # Prometheus metrics
│       ├── subscription/    # Stripe integration
│       └── vpn/             # WireGuard management
├── kubernetes/               # K8s manifests
├── docker-compose.yml        # Local development
└── README.md
```

## Environment Variables

### Backend
| Variable | Description | Production Value |
|----------|-------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - |
| `ADMIN_JWT_SECRET` | Admin JWT signing secret (min 32 chars) | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_REDIRECT_URL` | OAuth callback URL | `https://vpn.z-q.me/api/auth/google/callback` |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | - |
| `FRONTEND_URL` | Frontend URL | `https://vpn.z-q.me` |
| `ADMIN_FRONTEND_URL` | Admin frontend URL | `https://admin.vpn.z-q.me` |

### Frontend (User)
| Variable | Description | Production Value |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.vpn.z-q.me` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

### Frontend (Admin)
| Variable | Description | Production Value |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.vpn.z-q.me` |

## License

MIT License - See LICENSE file for details.

## Support

- Email: joeleboube@gmail.com
- Website: https://vpn.z-q.me
