# Use lightweight alpine-based image
FROM oven/bun:alpine AS base

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
# Copy source code
COPY --chown=bunjs:nodejs . .

USER bunjs

EXPOSE 3001

CMD ["bun", "src/index.ts"]
