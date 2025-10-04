#!/bin/bash
#
# Zero-Downtime Worker Deployment Script
#
# This script deploys new Temporal workers with worker versioning enabled,
# allowing old workflows to continue on old workers while new workflows
# use the new code.
#
# Usage:
#   ./scripts/deploy-workers.sh [--build-id BUILD_ID]
#
# Options:
#   --build-id    Override auto-detected build ID (for CI/CD)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Temporal Worker Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
BUILD_ID_ARG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --build-id)
      BUILD_ID_ARG="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--build-id BUILD_ID]"
      exit 1
      ;;
  esac
done

# Detect build ID from git if not provided
if [ -z "$BUILD_ID_ARG" ]; then
  echo -e "${BLUE}🔍 Auto-detecting build ID from git...${NC}"
  GIT_HASH=$(git rev-parse --short HEAD)
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  TIMESTAMP=$(date +%Y-%m-%d)
  BUILD_ID="${GIT_BRANCH}-${GIT_HASH}-${TIMESTAMP}"

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: Working directory has uncommitted changes${NC}"
    BUILD_ID="${BUILD_ID}-dirty"
  fi
else
  BUILD_ID="$BUILD_ID_ARG"
fi

echo -e "${GREEN}✅ Build ID: ${BUILD_ID}${NC}"
echo ""

# Step 1: Build application
echo -e "${BLUE}📦 Step 1: Building application...${NC}"
pnpm run build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Set default build ID in Temporal
echo -e "${BLUE}🔧 Step 2: Setting default build ID in Temporal...${NC}"
if [ -z "$BUILD_ID_ARG" ]; then
  pnpm exec tsx scripts/set-default-build-id.ts || {
    echo -e "${RED}❌ Failed to set default build ID${NC}"
    exit 1
  }
else
  pnpm exec tsx scripts/set-default-build-id.ts "$BUILD_ID" || {
    echo -e "${RED}❌ Failed to set default build ID${NC}"
    exit 1
  }
fi
echo -e "${GREEN}✅ Default build ID updated${NC}"
echo ""

# Step 3: Deploy workers (platform-specific)
echo -e "${BLUE}🚢 Step 3: Deploying workers...${NC}"
echo ""
echo -e "${YELLOW}⚠️  Platform-specific deployment not configured${NC}"
echo ""
echo "Uncomment the appropriate section below for your platform:"
echo ""
echo "# === Docker Compose ==="
echo "# export TEMPORAL_WORKER_BUILD_ID=\"$BUILD_ID\""
echo "# export TEMPORAL_WORKER_VERSIONING=true"
echo "# docker-compose up -d --build temporal-worker"
echo ""
echo "# === Kubernetes ==="
echo "# kubectl set env deployment/temporal-worker TEMPORAL_WORKER_BUILD_ID=$BUILD_ID"
echo "# kubectl set env deployment/temporal-worker TEMPORAL_WORKER_VERSIONING=true"
echo "# kubectl rollout restart deployment/temporal-worker"
echo ""
echo "# === AWS ECS ==="
echo "# aws ecs update-service --cluster freight-cluster --service temporal-worker \\"
echo "#   --task-definition temporal-worker:$BUILD_ID --force-new-deployment"
echo ""
echo "# === Manual (Local Development) ==="
echo "# TEMPORAL_WORKER_BUILD_ID=\"$BUILD_ID\" TEMPORAL_WORKER_VERSIONING=true pnpm run temporal:worker"
echo ""

# Step 4: Verify deployment
echo -e "${BLUE}✅ Step 4: Deployment steps completed${NC}"
echo ""
echo -e "${GREEN}📋 Summary:${NC}"
echo -e "   Build ID: ${GREEN}${BUILD_ID}${NC}"
echo -e "   Temporal: ${GREEN}Updated${NC}"
echo -e "   Workers: ${YELLOW}Manual deployment required${NC}"
echo ""

echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Deploy worker pods/containers with build ID: $BUILD_ID"
echo "   2. Set environment variables:"
echo "      - TEMPORAL_WORKER_BUILD_ID=$BUILD_ID"
echo "      - TEMPORAL_WORKER_VERSIONING=true"
echo "   3. Monitor worker logs for successful startup"
echo "   4. Verify new workflows route to new workers (Temporal UI)"
echo "   5. After old workflows complete, cleanup old workers:"
echo "      pnpm run temporal:cleanup-builds"
echo ""

echo -e "${GREEN}✅ Deployment preparation complete${NC}"
