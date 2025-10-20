#!/bin/bash

# Salini AMS Backup Script
# This script creates backups of the database and application files

set -e  # Exit on any error

# Configuration
APP_NAME="salini-ams"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
DB_NAME="salini_ams_prod"
DB_USER="salini_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

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

# Create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    log "Backup directory created: $BACKUP_DIR"
}

# Backup database
backup_database() {
    log "Backing up database..."
    
    local db_backup_file="$BACKUP_DIR/db_backup_$DATE.sql"
    
    # Create database backup
    sudo -u postgres pg_dump "$DB_NAME" > "$db_backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $db_backup_file"
        
        # Compress the backup
        gzip "$db_backup_file"
        log "Database backup compressed: $db_backup_file.gz"
    else
        error "Database backup failed"
    fi
}

# Backup application files
backup_application() {
    log "Backing up application files..."
    
    local app_backup_file="$BACKUP_DIR/app_backup_$DATE.tar.gz"
    
    # Create application backup (excluding logs and temporary files)
    tar -czf "$app_backup_file" \
        --exclude="$APP_DIR/backend/salini.api.API/logs" \
        --exclude="$APP_DIR/backend/salini.api.API/bin" \
        --exclude="$APP_DIR/backend/salini.api.API/obj" \
        --exclude="$APP_DIR/client/node_modules" \
        --exclude="$APP_DIR/client/.next" \
        -C /var/www "$APP_NAME"
    
    if [ $? -eq 0 ]; then
        log "Application backup created: $app_backup_file"
    else
        error "Application backup failed"
    fi
}

# Backup configuration files
backup_configs() {
    log "Backing up configuration files..."
    
    local config_backup_file="$BACKUP_DIR/config_backup_$DATE.tar.gz"
    
    # Create configuration backup
    tar -czf "$config_backup_file" \
        /etc/nginx/sites-available/salini-ams.conf \
        /etc/systemd/system/salini-api.service \
        /etc/ssl/certs/your-domain.crt \
        /etc/ssl/private/your-domain.key 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        log "Configuration backup created: $config_backup_file"
    else
        warning "Configuration backup completed with warnings"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleaned up"
}

# Verify backup integrity
verify_backups() {
    log "Verifying backup integrity..."
    
    local db_backup_file="$BACKUP_DIR/db_backup_$DATE.sql.gz"
    local app_backup_file="$BACKUP_DIR/app_backup_$DATE.tar.gz"
    
    # Verify database backup
    if [ -f "$db_backup_file" ]; then
        if gzip -t "$db_backup_file"; then
            log "Database backup integrity verified"
        else
            error "Database backup integrity check failed"
        fi
    fi
    
    # Verify application backup
    if [ -f "$app_backup_file" ]; then
        if tar -tzf "$app_backup_file" > /dev/null; then
            log "Application backup integrity verified"
        else
            error "Application backup integrity check failed"
        fi
    fi
}

# Generate backup report
generate_report() {
    log "Generating backup report..."
    
    local report_file="$BACKUP_DIR/backup_report_$DATE.txt"
    
    cat > "$report_file" << EOF
Salini AMS Backup Report
========================
Date: $(date)
Server: $(hostname)
Backup Directory: $BACKUP_DIR

Database Backup:
- File: db_backup_$DATE.sql.gz
- Size: $(du -h "$BACKUP_DIR/db_backup_$DATE.sql.gz" 2>/dev/null | cut -f1 || echo "N/A")

Application Backup:
- File: app_backup_$DATE.tar.gz
- Size: $(du -h "$BACKUP_DIR/app_backup_$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")

Configuration Backup:
- File: config_backup_$DATE.tar.gz
- Size: $(du -h "$BACKUP_DIR/config_backup_$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")

Total Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)

Backup Status: SUCCESS
EOF
    
    log "Backup report generated: $report_file"
}

# Main backup function
main() {
    log "Starting backup process for $APP_NAME..."
    
    create_backup_dir
    backup_database
    backup_application
    backup_configs
    cleanup_old_backups
    verify_backups
    generate_report
    
    log "Backup process completed successfully!"
    log "Backup location: $BACKUP_DIR"
}

# Run main function
main "$@"
