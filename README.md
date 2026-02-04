# Journal App

A full-stack journal application with offline support, built with Next.js, Express, and MongoDB.

## Architecture

- **Frontend**: Next.js 16 with static export for SPA (served by backend)
- **Backend**: Express.js with MongoDB and Redis caching (also serves static frontend)
- **Reverse Proxy**: Traefik routing to a single app container
- **Deployment**: Docker Compose with GitHub Actions CI/CD

## Project Structure

```
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   ├── Dockerfile    # Multi-stage build with frontend integration
│   │   └── public/       # Built frontend files (served by Express)
│   └── frontend/         # Next.js application
│       ├── src/
│       ├── Dockerfile
│       └── next.config.ts
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── compose.yaml          # Docker Compose configuration
├── traefik.dynamic.yml   # Traefik routing rules
└── .env.example          # Environment variables template
```

## Quick Start

### Local Development

1. **Clone and setup:**

   ```bash
   git clone <repo-url>
   cd journal
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run with Docker Compose:**

   ```bash
   docker compose up -d
   ```

3. **Access the app:**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Health Check: http://localhost/api/health

### Development without Docker

1. **Install dependencies:**

   ```bash
   # Backend
   cd apps/backend
   bun install

   # Frontend
   cd apps/frontend
   bun install
   ```

2. **Start services:**

   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   bun run src/index.ts

   # Terminal 2 - Frontend
   cd apps/frontend
   bun run dev
   ```

## Deployment

### GitHub Actions (Recommended)

The repository includes GitHub Actions workflows for automatic deployment:

1. **Push to main branch** triggers:
   - Build and push Docker images to GHCR
   - Deploy to production server via SSH

2. **Setup required secrets** in GitHub:
   - `SSH_PRIVATE_KEY`: SSH private key for your server
   - `DEPLOY_HOST`: Your server's IP or domain
   - `DEPLOY_USER`: SSH username
   - `NEXT_PUBLIC_API_URL`: Public API URL

See `.github/workflows/README.md` for detailed setup instructions.

### Manual Deployment

1. **On your server:**

   ```bash
   mkdir -p ~/journal
   cd ~/journal
   ```

2. **Copy configuration files:**

   ```bash
   # From local machine
   scp compose.yaml traefik.dynamic.yml .env user@server:~/journal/
   ```

3. **Deploy:**

   ```bash
   cd ~/journal

   # For Linux systems, export Docker GID:
   export DOCKER_GID="$(getent group docker | cut -d: -f3)"

   # Start services
   docker compose up -d
   ```

## Configuration

### Environment Variables

| Variable              | Description               | Required |
| --------------------- | ------------------------- | -------- |
| `MONGODB_URL`         | MongoDB connection string | Yes      |
| `JWT_SECRET`          | Secret key for JWT tokens | Yes      |
| `NEXT_PUBLIC_API_URL` | Public API URL            | Yes      |
| `CORS_ORIGIN`         | Allowed CORS origins      | Yes      |
| `REDIS_URL`           | Redis connection URL      | No       |
| `CACHE_ENABLED`       | Enable Redis caching      | No       |

See `.env.example` for all available options.

### Traefik Configuration

The application uses Traefik as a reverse proxy with Docker label-based routing:

- **All routes**: `/*` and `/api/*` → backend:3001 (single app container)

Routing is defined in the backend service labels in `compose.yaml`.

## Docker Images

Images are built automatically and pushed to GitHub Container Registry:

- Backend (includes built frontend assets): `ghcr.io/username/journal/backend`

## Key Changes from Original Setup

1. **Integrated Frontend Build**: The backend Dockerfile now includes a frontend build stage that compiles the Next.js app and copies static files to `./public`.

2. **Single App Container**: The backend serves both API and static frontend; Traefik routes all traffic to the backend container via labels.

3. **Simplified Compose**: Removed security restrictions that caused issues on Docker Desktop.

## Troubleshooting

### Container won't start

Check logs:

```bash
docker compose logs -f <service>
```

### Database connection issues

Verify MongoDB URL format and network connectivity:

```bash
# Test from backend container
docker compose exec backend wget -qO- http://localhost:3001/api/health
```

### CORS errors

Ensure `CORS_ORIGIN` includes your domain:

```env
CORS_ORIGIN=https://yourdomain.com,http://localhost:3000
```

## License

[Your License Here]
