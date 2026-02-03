# Use lightweight alpine-based image
FROM oven/bun:alpine AS base

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend package files
COPY ../../apps/frontend/package.json ../../apps/frontend/bun.lock ./
RUN bun install

# Copy frontend source
COPY ../../apps/frontend/ ./

# Pass build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the frontend (static export for SPA)
RUN bun run build

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs

# Copy node_modules from deps
COPY --from=deps --chown=bunjs:nodejs /app/node_modules ./node_modules

# Copy built frontend static files to public directory
COPY --from=frontend-builder --chown=bunjs:nodejs /app/dist ./public

# Copy backend source code
COPY --chown=bunjs:nodejs . .

USER bunjs

EXPOSE 3001

CMD ["bun", "src/index.ts"]
