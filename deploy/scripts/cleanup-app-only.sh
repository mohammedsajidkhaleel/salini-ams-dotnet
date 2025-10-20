#!/bin/bash

# Salini AMS Application-Only Cleanup Script
# This script removes only the application files and services, keeping packages installed

set -e  # Exit on any error

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

# Confirmation prompt
confirm_cleanup() {
    warning "This script will remove:"
    echo "  - Application files and directories"
    echo "  - Application services and configurations"
    echo "  - Database and user data"
    echo "  - Application logs and backups"
    echo ""
    info "This will KEEP installed packages (.NET, Node.js, PostgreSQL, Nginx)"
    echo ""
    read -p "Continue? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log "Cleanup cancelled."
        exit 0
    fi
}

# Stop application services
stop_services() {
    log "Stopping application services..."
    
    # Stop application services
    systemctl stop salini-api.service 2>/dev/null || warning "salini-api.service not running"
    
    # Stop PM2 processes
    pm2 stop salini-frontend 2>/dev/null || warning "salini-frontend not running"
    pm2 delete salini-frontend 2>/dev/null || warning "salini-frontend not found"
    
    log "Application services stopped."
}

# Remove application files
remove_application_files() {
    log "Removing application files..."
    
    # Remove application directory
    if [ -d "/var/www/salini-ams" ]; then
        rm -rf /var/www/salini-ams
        log "Application directory removed"
    fi
    
    # Remove application logs
    rm -rf /var/log/pm2/salini-frontend*
    rm -rf /var/log/salini-ams*
    
    # Remove application backups
    rm -rf /var/backups/salini-ams
    
    log "Application files removed."
}

# Remove systemd services
remove_systemd_services() {
    log "Removing systemd services..."
    
    # Disable and remove service files
    systemctl disable salini-api.service 2>/dev/null || warning "salini-api.service not enabled"
    rm -f /etc/systemd/system/salini-api.service
    systemctl daemon-reload
    
    log "Systemd services removed."
}

# Remove nginx site configuration
remove_nginx_site() {
    log "Removing nginx site configuration..."
    
    # Remove site configuration
    rm -f /etc/nginx/sites-available/salini-ams.conf
    rm -f /etc/nginx/sites-enabled/salini-ams.conf
    
    # Test nginx configuration
    nginx -t 2>/dev/null || warning "Nginx configuration test failed"
    
    log "Nginx site configuration removed."
}

# Remove database
remove_database() {
    log "Removing application database..."
    
    # Drop database and user
    sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS salini_ams_prod;
DROP DATABASE IF EXISTS salini_ams_dev;
DROP USER IF EXISTS salini_user;
\q
EOF
    
    log "Application database removed."
}

# Remove application cron jobs
remove_cron_jobs() {
    log "Removing application cron jobs..."
    
    # Remove monitoring script
    rm -f /usr/local/bin/salini-monitor.sh
    
    # Remove cron entries
    crontab -l 2>/dev/null | grep -v "salini-monitor.sh" | crontab - 2>/dev/null || warning "No cron jobs to remove"
    
    log "Application cron jobs removed."
}

# Remove log rotation configuration
remove_log_rotation() {
    log "Removing application log rotation configuration..."
    
    rm -f /etc/logrotate.d/salini-ams
    
    log "Application log rotation configuration removed."
}

# Show cleanup summary
show_summary() {
    log "Application cleanup completed successfully!"
    echo ""
    info "The following have been removed:"
    echo "  ✓ Application files and directories"
    echo "  ✓ Application services and configurations"
    echo "  ✓ Application database and user data"
    echo "  ✓ Application logs and backups"
    echo "  ✓ Application cron jobs and monitoring"
    echo ""
    info "The following have been KEPT:"
    echo "  ✓ .NET SDK and runtime"
    echo "  ✓ Node.js and npm"
    echo "  ✓ PostgreSQL server"
    echo "  ✓ Nginx web server"
    echo "  ✓ System packages and tools"
    echo ""
    info "The droplet is ready for a fresh application deployment."
    echo ""
    warning "Next steps:"
    echo "  1. Upload your application code"
    echo "  2. Configure your domain and settings"
    echo "  3. Run the deployment script: ./deploy/scripts/deploy.sh"
}

# Main cleanup function
main() {
    log "Starting application cleanup for Salini AMS..."
    
    confirm_cleanup
    stop_services
    remove_application_files
    remove_systemd_services
    remove_nginx_site
    remove_database
    remove_cron_jobs
    remove_log_rotation
    show_summary
}

# Run main function
main "$@"
