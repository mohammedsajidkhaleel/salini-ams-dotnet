#!/bin/bash

# Salini AMS Restore Script
# This script restores the application from backups

set -e  # Exit on any error

# Configuration
APP_NAME="salini-ams"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
DB_NAME="salini_ams_prod"
DB_USER="salini_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Show available backups
show_available_backups() {
    log "Available backups:"
    
    echo "Database Backups:"
    ls -la "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}' || echo "  No database backups found"
    
    echo "Application Backups:"
    ls -la "$BACKUP_DIR"/app_backup_*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}' || echo "  No application backups found"
    
    echo "Configuration Backups:"
    ls -la "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}' || echo "  No configuration backups found"
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    sudo systemctl stop salini-api.service || warning "Failed to stop salini-api service"
    pm2 stop salini-frontend || warning "Failed to stop salini-frontend"
    
    log "Services stopped."
}

# Restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Database backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Database backup file not found: $backup_file"
    fi
    
    log "Restoring database from: $backup_file"
    
    # Drop and recreate database
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Restore database
    gunzip -c "$backup_file" | sudo -u postgres psql "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        log "Database restored successfully"
    else
        error "Database restore failed"
    fi
}

# Restore application files
restore_application() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Application backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Application backup file not found: $backup_file"
    fi
    
    log "Restoring application files from: $backup_file"
    
    # Remove existing application directory
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    
    # Restore application files
    tar -xzf "$backup_file" -C /var/www/
    
    if [ $? -eq 0 ]; then
        log "Application files restored successfully"
        
        # Set permissions
        chown -R www-data:www-data "$APP_DIR"
        
        # Rebuild application
        log "Rebuilding application..."
        
        # Build backend
        cd "$APP_DIR/backend"
        sudo -u www-data dotnet restore
        sudo -u www-data dotnet build --configuration Release
        
        # Build frontend
        cd "$APP_DIR/client"
        sudo -u www-data npm ci --production
        sudo -u www-data npm run build
        
        log "Application rebuilt successfully"
    else
        error "Application restore failed"
    fi
}

# Restore configuration files
restore_configs() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        warning "Configuration backup file not specified, skipping configuration restore"
        return
    fi
    
    if [ ! -f "$backup_file" ]; then
        warning "Configuration backup file not found: $backup_file, skipping configuration restore"
        return
    fi
    
    log "Restoring configuration files from: $backup_file"
    
    # Extract configuration files
    tar -xzf "$backup_file" -C /
    
    if [ $? -eq 0 ]; then
        log "Configuration files restored successfully"
        
        # Reload systemd and nginx
        systemctl daemon-reload
        nginx -t && systemctl reload nginx
        
        log "Services reloaded"
    else
        warning "Configuration restore completed with warnings"
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start .NET API service
    sudo systemctl start salini-api.service
    
    # Start Next.js frontend with PM2
    cd "$APP_DIR"
    sudo -u www-data pm2 start ecosystem.config.js
    
    # Reload nginx
    sudo systemctl reload nginx
    
    log "Services started successfully."
}

# Verify restoration
verify_restoration() {
    log "Verifying restoration..."
    
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

# Interactive restore
interactive_restore() {
    show_available_backups
    
    echo ""
    info "Please select the backup files to restore:"
    
    # Get database backup
    echo "Enter database backup file (or press Enter to skip):"
    read -r db_backup
    
    # Get application backup
    echo "Enter application backup file (or press Enter to skip):"
    read -r app_backup
    
    # Get configuration backup
    echo "Enter configuration backup file (or press Enter to skip):"
    read -r config_backup
    
    # Confirm restoration
    echo ""
    warning "This will restore the application from backups. Are you sure? (yes/no)"
    read -r confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restoration cancelled."
        exit 0
    fi
    
    # Perform restoration
    stop_services
    
    if [ -n "$db_backup" ]; then
        restore_database "$BACKUP_DIR/$db_backup"
    fi
    
    if [ -n "$app_backup" ]; then
        restore_application "$BACKUP_DIR/$app_backup"
    fi
    
    if [ -n "$config_backup" ]; then
        restore_configs "$BACKUP_DIR/$config_backup"
    fi
    
    start_services
    verify_restoration
    
    log "Restoration completed successfully!"
}

# Command line restore
command_line_restore() {
    local db_backup=$1
    local app_backup=$2
    local config_backup=$3
    
    stop_services
    
    if [ -n "$db_backup" ]; then
        restore_database "$BACKUP_DIR/$db_backup"
    fi
    
    if [ -n "$app_backup" ]; then
        restore_application "$BACKUP_DIR/$app_backup"
    fi
    
    if [ -n "$config_backup" ]; then
        restore_configs "$BACKUP_DIR/$config_backup"
    fi
    
    start_services
    verify_restoration
    
    log "Restoration completed successfully!"
}

# Main function
main() {
    log "Starting restoration process for $APP_NAME..."
    
    if [ $# -eq 0 ]; then
        interactive_restore
    else
        command_line_restore "$@"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [database_backup] [application_backup] [configuration_backup]"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Interactive mode"
    echo "  $0 db_backup_20240101_120000.sql.gz  # Restore database only"
    echo "  $0 db_backup_20240101_120000.sql.gz app_backup_20240101_120000.tar.gz  # Restore database and application"
    echo "  $0 db_backup_20240101_120000.sql.gz app_backup_20240101_120000.tar.gz config_backup_20240101_120000.tar.gz  # Restore all"
}

# Check arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"
