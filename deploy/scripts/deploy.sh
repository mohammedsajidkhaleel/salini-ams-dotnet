#!/bin/bash

# Salini AMS Deployment Script
# This script deploys the application to a Digital Ocean droplet

set -e  # Exit on any error

# Configuration
APP_NAME="salini-ams"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/deploy-$APP_NAME.log"
SERVICE_USER="www-data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a user with sudo privileges."
fi

# Check if required commands exist
check_requirements() {
    log "Checking requirements..."
    
    local missing_commands=()
    
    if ! command -v dotnet &> /dev/null; then
        missing_commands+=("dotnet")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_commands+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_commands+=("npm")
    fi
    
    if ! command -v pm2 &> /dev/null; then
        missing_commands+=("pm2")
    fi
    
    if ! command -v nginx &> /dev/null; then
        missing_commands+=("nginx")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        error "Missing required commands: ${missing_commands[*]}. Please install them first."
    fi
    
    log "All requirements satisfied."
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    if [ -d "$APP_DIR" ]; then
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        sudo mkdir -p "$BACKUP_DIR"
        sudo cp -r "$APP_DIR" "$backup_path"
        log "Backup created at $backup_path"
        
        # Keep only last 5 backups
        sudo find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup-*" | sort -r | tail -n +6 | sudo xargs rm -rf
    else
        log "No existing application found, skipping backup."
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    sudo systemctl stop salini-api.service || warning "Failed to stop salini-api service"
    pm2 stop salini-frontend || warning "Failed to stop salini-frontend"
    
    log "Services stopped."
}

# Deploy backend
deploy_backend() {
    log "Deploying backend..."
    
    # Create application directory
    sudo mkdir -p "$APP_DIR"
    
    # Copy backend files
    sudo cp -r backend "$APP_DIR/"
    
    # Set permissions
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$APP_DIR"
    
    # Build the application
    cd "$APP_DIR/backend"
    sudo -u $SERVICE_USER dotnet restore
    sudo -u $SERVICE_USER dotnet build --configuration Release
    
    # Publish the API
    cd salini.api.API
    sudo -u $SERVICE_USER dotnet publish --configuration Release --output ./publish
    
    # Create logs directory
    sudo mkdir -p "$APP_DIR/backend/salini.api.API/logs"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$APP_DIR/backend/salini.api.API/logs"
    
    log "Backend deployed successfully."
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    # Copy frontend files
    sudo cp -r client "$APP_DIR/"
    
    # Set permissions
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$APP_DIR/client"
    
    # Install dependencies and build
    cd "$APP_DIR/client"
    sudo -u $SERVICE_USER npm ci --production
    sudo -u $SERVICE_USER npm run build
    
    log "Frontend deployed successfully."
}

# Update configuration files
update_configs() {
    log "Updating configuration files..."
    
    # Copy systemd service file
    sudo cp deploy/systemd/salini-api.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable salini-api.service
    
    # Copy PM2 ecosystem file
    sudo cp deploy/pm2/ecosystem.config.js "$APP_DIR/"
    sudo chown $SERVICE_USER:$SERVICE_USER "$APP_DIR/ecosystem.config.js"
    
    # Copy nginx configuration
    sudo cp deploy/nginx/salini-ams.conf /etc/nginx/sites-available/
    
    # Enable nginx site if not already enabled
    if [ ! -L /etc/nginx/sites-enabled/salini-ams.conf ]; then
        sudo ln -s /etc/nginx/sites-available/salini-ams.conf /etc/nginx/sites-enabled/
    fi
    
    # Test nginx configuration
    sudo nginx -t || error "Nginx configuration test failed"
    
    log "Configuration files updated."
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start .NET API service
    sudo systemctl enable salini-api.service
    sudo systemctl start salini-api.service
    
    # Start Next.js frontend with PM2
    cd "$APP_DIR"
    sudo -u $SERVICE_USER pm2 start ecosystem.config.js
    sudo -u $SERVICE_USER pm2 save
    sudo -u $SERVICE_USER pm2 startup systemd -u $SERVICE_USER --hp /home/$SERVICE_USER
    
    # Reload nginx
    sudo systemctl reload nginx
    
    log "Services started successfully."
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check API health
    if curl -f http://127.0.0.1:5000/health > /dev/null 2>&1; then
        log "API health check passed."
    else
        error "API health check failed."
    fi
    
    # Check frontend
    if curl -f http://127.0.0.1:3000 > /dev/null 2>&1; then
        log "Frontend health check passed."
    else
        error "Frontend health check failed."
    fi
    
    # Check nginx
    if sudo systemctl is-active --quiet nginx; then
        log "Nginx is running."
    else
        error "Nginx is not running."
    fi
    
    log "All health checks passed."
}

# Main deployment function
main() {
    log "Starting deployment of $APP_NAME..."
    
    check_requirements
    create_backup
    stop_services
    deploy_backend
    deploy_frontend
    update_configs
    start_services
    health_check
    
    log "Deployment completed successfully!"
    log "Application is available at: https://your-domain.com"
    log "API documentation: https://your-domain.com/swagger"
    log "Health check: https://your-domain.com/health"
}

# Run main function
main "$@"
