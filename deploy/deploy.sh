#!/bin/bash

###############################################################################
# Eduflow Production Deployment Script
# Author: CTO
# Description: Complete deployment automation for VPS
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/eduflow-app"
DOMAIN="your-domain.com"  # Replace with your actual domain
EMAIL="your-email@example.com"  # Replace with your email for SSL

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
fi

###############################################################################
# Step 1: System Preparation
###############################################################################

log_info "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y

log_info "Installing required system packages..."
apt-get install -y curl git build-essential python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

###############################################################################
# Step 2: Install Node.js (if not installed)
###############################################################################

log_info "Step 2: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log_info "Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    log_success "Node.js is already installed: $(node --version)"
fi

###############################################################################
# Step 3: Install PM2
###############################################################################

log_info "Step 3: Installing PM2..."
npm install -g pm2

###############################################################################
# Step 4: Clone or Update Project
###############################################################################

log_info "Step 4: Setting up project directory..."
if [ ! -d "$PROJECT_DIR" ]; then
    log_info "Project directory not found. Please clone your repository first:"
    log_warning "Example: git clone https://github.com/your-repo/eduflow-app.git $PROJECT_DIR"
    log_error "Exiting. Please clone the repository and run this script again."
else
    log_success "Project directory exists: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

###############################################################################
# Step 5: Setup Backend (Python FastAPI)
###############################################################################

log_info "Step 5: Setting up Python Backend..."
cd "$PROJECT_DIR/api"

# Create virtual environment
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
log_info "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Check .env file
if [ ! -f ".env" ]; then
    log_warning "Backend .env file not found!"
    log_info "Creating template .env file. Please edit it with your API keys."
    cat > .env << 'EOF'
# Backend Environment Variables
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.siliconflow.cn/v1
SECRET_KEY=change-this-to-secure-random-string
EOF
    log_warning "Please edit $PROJECT_DIR/api/.env with your actual API keys!"
fi

# Initialize database
log_info "Initializing database..."
python3 << 'PYEOF'
from main import Base, engine
Base.metadata.create_all(bind=engine)
print("Database initialized successfully")
PYEOF

deactivate

###############################################################################
# Step 6: Setup Frontend (Next.js)
###############################################################################

log_info "Step 6: Setting up Next.js Frontend..."
cd "$PROJECT_DIR"

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install

# Build production bundle
log_info "Building Next.js production bundle..."
npm run build

###############################################################################
# Step 7: Configure PM2
###############################################################################

log_info "Step 7: Configuring PM2..."

# Stop existing processes
pm2 delete eduflow-backend 2>/dev/null || true
pm2 delete eduflow-frontend 2>/dev/null || true

# Start Backend
log_info "Starting Backend with PM2..."
cd "$PROJECT_DIR/api"
pm2 start venv/bin/uvicorn --name eduflow-backend -- main:app --host 0.0.0.0 --port 8000

# Start Frontend
log_info "Starting Frontend with PM2..."
cd "$PROJECT_DIR"
pm2 start npm --name eduflow-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u root --hp /root
log_info "PM2 startup configured. Run the command above if needed."

###############################################################################
# Step 8: Configure Nginx
###############################################################################

log_info "Step 8: Configuring Nginx..."

# Backup existing config if exists
if [ -f "/etc/nginx/sites-available/eduflow" ]; then
    log_info "Backing up existing Nginx config..."
    cp /etc/nginx/sites-available/eduflow "/etc/nginx/sites-available/eduflow.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Update domain in nginx config
log_info "Creating Nginx configuration..."
sed "s/your-domain.com/$DOMAIN/g" "$PROJECT_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/eduflow

# Enable site
ln -sf /etc/nginx/sites-available/eduflow /etc/nginx/sites-enabled/

# Test Nginx configuration
log_info "Testing Nginx configuration..."
nginx -t

# Reload Nginx
log_info "Reloading Nginx..."
systemctl reload nginx

###############################################################################
# Step 9: Setup SSL with Certbot
###############################################################################

log_info "Step 9: Setting up SSL certificate..."
log_warning "Make sure your domain $DOMAIN is pointing to this server's IP!"
read -p "Press Enter to continue with SSL setup (or Ctrl+C to cancel)..."

certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect

# Setup auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

###############################################################################
# Step 10: Configure Firewall
###############################################################################

log_info "Step 10: Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

###############################################################################
# Deployment Complete
###############################################################################

log_success "=========================================="
log_success "  Eduflow Deployment Complete!"
log_success "=========================================="
echo ""
log_info "Services Status:"
pm2 status
echo ""
log_info "Access your application at:"
log_success "  https://$DOMAIN"
echo ""
log_info "Useful Commands:"
echo "  - Check logs: pm2 logs"
echo "  - Backend logs: pm2 logs eduflow-backend"
echo "  - Frontend logs: pm2 logs eduflow-frontend"
echo "  - Restart services: pm2 restart all"
echo "  - Check Nginx: systemctl status nginx"
echo "  - SSL renewal test: certbot renew --dry-run"
echo ""
log_warning "IMPORTANT: Remember to update the following files:"
log_warning "  1. $PROJECT_DIR/api/.env (API keys and secrets)"
log_warning "  2. Configure your domain DNS to point to this server"
echo ""
