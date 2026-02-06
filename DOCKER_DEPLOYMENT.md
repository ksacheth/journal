# Docker Deployment Guide

## Authentication Fix for Docker

The authentication system has been updated to work properly in Docker. Here's what changed:

### Key Changes

1. **Traefik Routing**: Updated to route specific backend paths only, allowing frontend Next.js API routes to work
2. **Token Exchange System**: Frontend generates JWT tokens for backend authentication
3. **Environment Variables**: All auth-related env vars properly passed to containers

### Critical Configuration

#### 1. Traefik Routes (traefik.dynamic.yml)

- `/api/entries/*` and `/api/entry/*` → Backend
- `/api/signin`, `/api/signup`, `/api/signout` → Backend
- `/api/health` → Backend
- `/api/auth/*` (NextAuth) → Frontend
- `/api/backend-token` (JWT generation) → Frontend
- Everything else → Frontend

#### 2. Environment Variables

Ensure your `.env` file has:

```bash
# Must be the same secret across all services!
AUTH_SECRET=+O/JZNni2pZ68bjwgd7iwkkhTP7bIuGWu7rqpnLsk4k=

# Production URLs
NEXTAUTH_URL=https://journal.sachethkoushal.tech
NEXT_PUBLIC_API_URL=

# CORS (include your production domain)
CORS_ORIGIN=https://journal.sachethkoushal.tech,http://localhost:3000

# MongoDB (must be accessible from Docker containers)
MONGODB_URL=mongodb://host.docker.internal:27017/journal
```

### Deployment Steps

1. **Update Environment Variables**

   ```bash
   # Copy production template
   cp .env.production.example .env

   # Edit with your values
   nano .env
   ```

2. **Build and Deploy**

   ```bash
   # Stop existing containers
   docker compose down

   # Rebuild with new changes
   docker compose build --no-cache

   # Start services
   docker compose up -d

   # Check logs
   docker compose logs -f frontend
   docker compose logs -f backend
   ```

3. **Verify Deployment**
   - Check Traefik is routing correctly
   - Test sign-in flow
   - Verify backend API calls work
   - Check browser console for errors
   - Review backend logs for authentication success

### Authentication Flow in Docker

```
User Browser
  ↓
1. Sign in via NextAuth → NextAuth session cookie stored
  ↓
2. Make API call to backend
  ↓
3. Frontend interceptor calls /api/backend-token (via Traefik → Frontend)
  ↓
4. Frontend validates NextAuth session, generates signed JWT
  ↓
5. JWT added to Authorization: Bearer header
  ↓
6. API call to /api/entries/... (via Traefik → Backend)
  ↓
7. Backend verifies JWT signature with AUTH_SECRET
  ↓
8. ✅ Request succeeds
```

### Troubleshooting

**Issue: 401 Unauthorized on API calls**

- Check AUTH_SECRET is identical in .env, frontend container, and backend container
- Verify `/api/backend-token` is routed to frontend (not backend)
- Check browser console for token generation logs

**Issue: CORS errors**

- Verify CORS_ORIGIN includes your production domain
- Check if using HTTPS (might need `trustHost: true` in auth.ts)

**Issue: MongoDB connection failed**

- Ensure MONGODB_URL is accessible from Docker containers
- For local MongoDB: use `mongodb://host.docker.internal:27017/journal`
- For MongoDB Atlas: use connection string with proper credentials

**Issue: NextAuth errors**

- Verify NEXTAUTH_URL matches your production domain
- Check AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are valid
- Ensure Google OAuth redirect URIs include production URL

### Monitoring

```bash
# Check all services
docker compose ps

# View frontend logs (see token generation)
docker compose logs -f frontend | grep "backend-token"

# View backend logs (see auth verification)
docker compose logs -f backend | grep "Auth token verified"

# Check Traefik routing
docker compose logs -f traefik
```

### Health Checks

- Backend: `http://journal.sachethkoushal.tech/api/health`
- Frontend: `http://journal.sachethkoushal.tech` (should load)
- Traefik: `docker compose ps` (all services should be "healthy")

## Production Checklist

- [ ] AUTH_SECRET is a strong random value (min 32 chars)
- [ ] AUTH_SECRET is identical in all services
- [ ] NEXTAUTH_URL matches production domain (with https://)
- [ ] CORS_ORIGIN includes production domain
- [ ] MongoDB is accessible and credentials are correct
- [ ] Google OAuth credentials are for production domain
- [ ] Traefik routing config is updated
- [ ] Environment variables are passed to containers
- [ ] Services successfully start and pass health checks
- [ ] Sign-in flow works end-to-end
- [ ] Backend API calls return data (not 401)
