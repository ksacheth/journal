# Use lightweight alpine-based image
FROM oven/bun:alpine AS base

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend package files first
COPY apps/frontend/package.json apps/frontend/bun.lock ./

# Install dependencies
RUN bun install

# Copy frontend source (excluding node_modules via .dockerignore)
# Note: We copy specific directories to avoid node_modules conflict
COPY apps/frontend/app ./app
COPY apps/frontend/components ./components
COPY apps/frontend/lib ./lib
COPY apps/frontend/public ./public
COPY apps/frontend/next.config.ts apps/frontend/tsconfig.json apps/frontend/postcss.config.mjs apps/frontend/eslint.config.mjs ./

# Pass build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the frontend (static export outputs to ./out)
RUN bun run build

# Install backend dependencies
FROM base AS deps
WORKDIR /app
COPY apps/backend/package.json apps/backend/bun.lock ./
RUN bun install --production

# Production image
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
# Next.js static export outputs to ./out
COPY --from=frontend-builder --chown=bunjs:nodejs /app/out ./public

# Copy backend source code (excluding node_modules)
COPY --chown=bunjs:nodejs apps/backend/src ./src
COPY --chown=bunjs:nodejs apps/backend/package.json apps/backend/tsconfig.json ./

USER bunjs
EXPOSE 3001
CMD ["bun", "src/index.ts"]
