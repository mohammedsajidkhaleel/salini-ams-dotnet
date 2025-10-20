#!/bin/bash

# Quick fix script for salini-api.service not found error
# Run this script if you get "Unit salini-api.service could not be found"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Check if service file exists
if [ ! -f "/var/www/salini-ams/deploy/systemd/salini-api.service" ]; then
    error "Service file not found at /var/www/salini-ams/deploy/systemd/salini-api.service"
fi

log "Installing salini-api.service..."

# Copy service file
cp /var/www/salini-ams/deploy/systemd/salini-api.service /etc/systemd/system/

# Reload systemd daemon
systemctl daemon-reload

# Enable the service
systemctl enable salini-api.service

# Check if service is now recognized
if systemctl list-unit-files | grep -q "salini-api.service"; then
    log "Service installed successfully!"
    
    # Show service status
    log "Service status:"
    systemctl status salini-api.service --no-pager -l
    
    # Try to start the service
    log "Attempting to start the service..."
    systemctl start salini-api.service
    
    # Check if service is running
    if systemctl is-active --quiet salini-api.service; then
        log "Service started successfully!"
    else
        warning "Service failed to start. Checking logs..."
        journalctl -u salini-api.service --no-pager -l
    fi
else
    error "Service installation failed"
fi

log "Fix completed!"
