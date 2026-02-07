#!/bin/bash

###############################################################################
# Pre-Deployment Checklist Script
# Run this before deploying to production
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "🔍 Running Pre-Deployment Checks..."
echo "=================================="
echo ""

# Check 1: Node.js version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js version too old. Required: 18+, Found: $(node -v)"
    ((ERRORS++))
fi

# Check 2: Python version
echo -n "Checking Python version... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1)
    if [ "$PYTHON_VERSION" -ge 3 ]; then
        echo -e "${GREEN}✓${NC} $(python3 --version)"
    else
        echo -e "${RED}✗${NC} Python version too old"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Python3 not found"
    ((ERRORS++))
fi

# Check 3: package.json exists
echo -n "Checking package.json... "
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} package.json not found"
    ((ERRORS++))
fi

# Check 4: Backend requirements.txt exists
echo -n "Checking api/requirements.txt... "
if [ -f "api/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} api/requirements.txt not found"
    ((ERRORS++))
fi

# Check 5: Backend .env file
echo -n "Checking api/.env file... "
if [ -f "api/.env" ]; then
    echo -e "${GREEN}✓${NC}"
    
    # Check if API key is configured
    if grep -q "LLM_API_KEY=your-api-key-here" api/.env || grep -q "LLM_API_KEY=$" api/.env; then
        echo -e "  ${YELLOW}⚠${NC}  Warning: LLM_API_KEY not configured in api/.env"
        ((WARNINGS++))
    fi
    
    # Check if SECRET_KEY is default
    if grep -q "SECRET_KEY=eduflow-secret-key-2025" api/.env; then
        echo -e "  ${YELLOW}⚠${NC}  Warning: Using default SECRET_KEY (security risk!)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} api/.env not found"
    ((ERRORS++))
fi

# Check 6: Dependencies installation
echo -n "Checking Node.js dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}  node_modules not found. Run 'npm install'"
    ((WARNINGS++))
fi

# Check 7: Python virtual environment
echo -n "Checking Python virtual environment... "
if [ -d "api/venv" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}  Virtual environment not found. Run 'python3 -m venv api/venv'"
    ((WARNINGS++))
fi

# Check 8: Build directory
echo -n "Checking Next.js build... "
if [ -d ".next" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}  .next directory not found. Run 'npm run build'"
    ((WARNINGS++))
fi

# Check 9: PM2 ecosystem config
echo -n "Checking PM2 config... "
if [ -f "ecosystem.config.js" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}  ecosystem.config.js not found"
    ((WARNINGS++))
fi

# Check 10: Nginx config
echo -n "Checking Nginx config... "
if [ -f "deploy/nginx.conf" ]; then
    echo -e "${GREEN}✓${NC}"
    
    # Check if domain is still placeholder
    if grep -q "your-domain.com" deploy/nginx.conf; then
        echo -e "  ${YELLOW}⚠${NC}  Warning: Domain still set to 'your-domain.com'"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC}  deploy/nginx.conf not found"
    ((WARNINGS++))
fi

# Check 11: Deployment script
echo -n "Checking deployment script... "
if [ -f "deploy/deploy.sh" ]; then
    if [ -x "deploy/deploy.sh" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC}  deploy.sh not executable. Run 'chmod +x deploy/deploy.sh'"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} deploy/deploy.sh not found"
    ((ERRORS++))
fi

# Check 12: Security - Hardcoded secrets
echo -n "Checking for hardcoded secrets... "
if grep -r "sk-[a-zA-Z0-9]\{32,\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" . 2>/dev/null | grep -v ".env" | grep -v "node_modules" | grep -v "venv" > /dev/null; then
    echo -e "${RED}✗${NC} Potential API keys found in code!"
    echo -e "  ${RED}⚠${NC}  CRITICAL: Remove hardcoded API keys before deploying"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC}"
fi

echo ""
echo "=================================="
echo "📊 Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"
echo "=================================="
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Pre-deployment checks FAILED${NC}"
    echo "Please fix the errors above before deploying."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Pre-deployment checks passed with warnings${NC}"
    echo "Review the warnings above before deploying."
    exit 0
else
    echo -e "${GREEN}✅ All pre-deployment checks passed!${NC}"
    echo "You can proceed with deployment."
    exit 0
fi
