#!/bin/bash

# Docker Deployment Validation Script
# Run this before deploying to check configuration

set -e

echo "🔍 Validating Docker Deployment Configuration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Copy .env.production.example to .env and configure it"
    exit 1
fi

echo -e "${GREEN}✓${NC} .env file exists"

# Source .env file
set -a
source .env
set +a

# Validate AUTH_SECRET
echo ""
echo "🔑 Checking AUTH_SECRET..."
if [ -z "$AUTH_SECRET" ]; then
    echo -e "${RED}❌ AUTH_SECRET is not set${NC}"
    exit 1
elif [ "$AUTH_SECRET" = "your-secure-random-secret-min-32-chars" ]; then
    echo -e "${YELLOW}⚠️  AUTH_SECRET is still the default value${NC}"
    echo "   Generate a new secret: openssl rand -base64 32"
    exit 1
elif [ ${#AUTH_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  AUTH_SECRET is too short (${#AUTH_SECRET} chars, need 32+)${NC}"
    exit 1
else
    echo -e "${GREEN}✓${NC} AUTH_SECRET is set and strong (${#AUTH_SECRET} chars)"
fi

# Check MONGODB_URL
echo ""
echo "🗄️  Checking MongoDB configuration..."
if [ -z "$MONGODB_URL" ]; then
    echo -e "${RED}❌ MONGODB_URL is not set${NC}"
    exit 1
else
    echo -e "${GREEN}✓${NC} MONGODB_URL is configured"
fi

# Check NEXTAUTH_URL
echo ""
echo "🌐 Checking NextAuth URL..."
if [ -z "$NEXTAUTH_URL" ]; then
    echo -e "${RED}❌ NEXTAUTH_URL is not set${NC}"
    exit 1
elif [[ "$NEXTAUTH_URL" == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  NEXTAUTH_URL is set to localhost${NC}"
    echo "   For production, use your actual domain (e.g., https://journal.sachethkoushal.tech)"
fi

if [[ "$NEXTAUTH_URL" == https://* ]]; then
    echo -e "${GREEN}✓${NC} NEXTAUTH_URL uses HTTPS"
else
    echo -e "${YELLOW}⚠️  NEXTAUTH_URL should use HTTPS in production${NC}"
fi

# Check CORS_ORIGIN
echo ""
echo "🔒 Checking CORS configuration..."
if [ -z "$CORS_ORIGIN" ]; then
    echo -e "${YELLOW}⚠️  CORS_ORIGIN is not set${NC}"
else
    echo -e "${GREEN}✓${NC} CORS_ORIGIN is configured"
    if [[ "$CORS_ORIGIN" == *"journal.sachethkoushal.tech"* ]]; then
        echo -e "${GREEN}✓${NC} Production domain included in CORS"
    else
        echo -e "${YELLOW}⚠️  Production domain not found in CORS_ORIGIN${NC}"
    fi
fi

# Check Google OAuth
echo ""
echo "🔐 Checking OAuth configuration..."
if [ -z "$AUTH_GOOGLE_ID" ] || [ "$AUTH_GOOGLE_ID" = "your-google-client-id" ]; then
    echo -e "${YELLOW}⚠️  AUTH_GOOGLE_ID not configured (Google sign-in will not work)${NC}"
else
    echo -e "${GREEN}✓${NC} AUTH_GOOGLE_ID is set"
fi

# Check required files
echo ""
echo "📁 Checking required files..."
required_files=(
    "compose.yaml"
    "traefik.dynamic.yml"
    "apps/frontend/Dockerfile"
    "apps/backend/Dockerfile"
    "apps/frontend/auth.ts"
    "apps/frontend/app/api/backend-token/route.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓${NC} All required files present"

# Check Docker is running
echo ""
echo "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
else
    echo -e "${GREEN}✓${NC} Docker is running"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Configuration validation passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now deploy with:"
echo "  docker compose down"
echo "  docker compose build --no-cache"
echo "  docker compose up -d"
echo ""
echo "Monitor deployment:"
echo "  docker compose logs -f"
