#!/bin/bash

# Render Deployment Checklist Script
# Run this before deploying to ensure everything is ready

echo "🔍 Checking Render Deployment Readiness..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 directory exists"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 directory is missing"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo "📁 Checking Required Files..."
check_file "render.yaml"
check_file "render-build.sh"
check_file "apps/backend/server.js"
check_file "apps/backend/package.json"
check_file "apps/backend/requirements.txt"
check_file "apps/frontend/package.json"
check_file ".gitignore"

echo ""
echo "📂 Checking Required Directories..."
check_dir "apps/backend"
check_dir "apps/frontend"
check_dir "apps/backend/modules"
check_dir "apps/frontend/src"
check_dir "apps/frontend/public"

echo ""
echo "🔧 Checking Configuration..."

# Check if render-build.sh is executable
if [ -x "render-build.sh" ]; then
    echo -e "${GREEN}✓${NC} render-build.sh is executable"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} render-build.sh is not executable (will be fixed by Render)"
fi

# Check for .env files (should not be committed)
if [ -f "apps/frontend/.env" ]; then
    echo -e "${YELLOW}⚠${NC} apps/frontend/.env exists (ensure it's in .gitignore)"
else
    echo -e "${GREEN}✓${NC} No .env file in frontend (good for deployment)"
    ((CHECKS_PASSED++))
fi

if [ -f "apps/backend/.env" ]; then
    echo -e "${YELLOW}⚠${NC} apps/backend/.env exists (ensure it's in .gitignore)"
else
    echo -e "${GREEN}✓${NC} No .env file in backend (good for deployment)"
    ((CHECKS_PASSED++))
fi

echo ""
echo "📦 Checking Dependencies..."

# Check if node_modules exists locally (not needed for deployment)
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC} node_modules exists (will be rebuilt on Render)"
else
    echo -e "${GREEN}✓${NC} No node_modules (clean deployment)"
    ((CHECKS_PASSED++))
fi

echo ""
echo "🔍 Checking Git Status..."

# Check if git is initialized
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    ((CHECKS_PASSED++))
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠${NC} You have uncommitted changes"
        echo "   Run: git add . && git commit -m 'Ready for deployment'"
    else
        echo -e "${GREEN}✓${NC} No uncommitted changes"
        ((CHECKS_PASSED++))
    fi
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✓${NC} Git remote 'origin' is set"
        ((CHECKS_PASSED++))
        git remote -v | grep "origin" | head -1
    else
        echo -e "${RED}✗${NC} Git remote 'origin' is not set"
        echo "   Run: git remote add origin https://github.com/YOUR_USERNAME/ProWellAvatar.git"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Git repository not initialized"
    echo "   Run: git init"
    ((CHECKS_FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo -e "   ${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "   ${RED}Failed: $CHECKS_FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Ready for Render deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Go to https://dashboard.render.com"
    echo "3. Click 'New +' → 'Blueprint'"
    echo "4. Select your repository"
    echo "5. Click 'Apply'"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Please fix the issues above before deploying${NC}"
    echo ""
fi
