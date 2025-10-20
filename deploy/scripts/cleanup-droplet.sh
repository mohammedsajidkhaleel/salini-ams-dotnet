#!/bin/bash

# Digital Ocean Droplet Cleanup Script for Salini AMS
# This script completely cleans the droplet to avoid deployment issues

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
    warning "This script will completely clean the droplet and remove:"
    echo "  - All application files"
    echo "  - All services and configurations"
    echo "  - All databases and data"
    echo "  - All logs and backups"
    echo "  - All installed packages (except system packages)"
    echo ""
    warning "This action is IRREVERSIBLE!"
    echo ""
    read -p "Are you absolutely sure you want to continue? Type 'YES' to confirm: " confirm
    
    if [ "$confirm" != "YES" ]; then
        log "Cleanup cancelled."
        exit 0
    fi
}

# Stop all services
stop_services() {
    log "Stopping all services..."
    
    # Stop application services
    systemctl stop salini-api.service 2>/dev/null || warning "salini-api.service not running"
    systemctl stop nginx 2>/dev/null || warning "nginx not running"
    systemctl stop postgresql 2>/dev/null || warning "postgresql not running"
    
    # Stop PM2 processes
    pm2 stop all 2>/dev/null || warning "No PM2 processes running"
    pm2 delete all 2>/dev/null || warning "No PM2 processes to delete"
    
    log "All services stopped."
}

# Remove application files
remove_application_files() {
    log "Removing application files..."
    
    # Remove application directory
    if [ -d "/var/www/salini-ams" ]; then
        rm -rf /var/www/salini-ams
        log "Application directory removed"
    fi
    
    # Remove logs
    rm -rf /var/log/pm2
    rm -rf /var/log/salini-ams*
    
    # Remove backups
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

# Remove nginx configuration
remove_nginx_config() {
    log "Removing nginx configuration..."
    
    # Remove site configuration
    rm -f /etc/nginx/sites-available/salini-ams.conf
    rm -f /etc/nginx/sites-enabled/salini-ams.conf
    
    # Remove SSL certificates (optional - comment out if you want to keep them)
    # rm -f /etc/ssl/certs/your-domain.crt
    # rm -f /etc/ssl/private/your-domain.key
    
    # Test nginx configuration
    nginx -t 2>/dev/null || warning "Nginx configuration test failed"
    
    log "Nginx configuration removed."
}

# Remove database
remove_database() {
    log "Removing database..."
    
    # Drop database and user
    sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS salini_ams_prod;
DROP DATABASE IF EXISTS salini_ams_dev;
DROP USER IF EXISTS salini_user;
\q
EOF
    
    log "Database removed."
}

# Remove installed packages
remove_packages() {
    log "Removing installed packages..."
    
    # Remove .NET SDK
    apt remove -y dotnet-sdk-8.0 dotnet-runtime-8.0 2>/dev/null || warning "Dotnet packages not found"
    
    # Remove Node.js and npm
    apt remove -y nodejs npm 2>/dev/null || warning "Node.js packages not found"
    
    # Remove PM2 globally
    npm uninstall -g pm2 2>/dev/null || warning "PM2 not found"
    
    # Remove PostgreSQL
    apt remove -y postgresql postgresql-contrib 2>/dev/null || warning "PostgreSQL not found"
    
    # Remove Nginx
    apt remove -y nginx 2>/dev/null || warning "Nginx not found"
    
    # Remove Certbot
    apt remove -y certbot python3-certbot-nginx 2>/dev/null || warning "Certbot not found"
    
    # Remove additional tools
    apt remove -y git htop unzip zip fail2ban 2>/dev/null || warning "Some tools not found"
    
    # Clean up package cache
    apt autoremove -y
    apt autoclean
    
    log "Packages removed."
}

# Remove repositories
remove_repositories() {
    log "Removing added repositories..."
    
    # Remove Microsoft repository
    rm -f /etc/apt/sources.list.d/microsoft-prod.list
    rm -f /etc/apt/trusted.gpg.d/microsoft.gpg
    
    # Remove NodeSource repository
    rm -f /etc/apt/sources.list.d/nodesource.list
    rm -f /etc/apt/trusted.gpg.d/nodesource.gpg
    
    # Update package list
    apt update
    
    log "Repositories removed."
}

# Remove users and groups
remove_users() {
    log "Cleaning up users and groups..."
    
    # Remove application user if it exists
    if id "www-data" &>/dev/null; then
        # Don't remove www-data as it's a system user
        log "Keeping www-data user (system user)"
    fi
    
    log "User cleanup completed."
}

# Remove cron jobs
remove_cron_jobs() {
    log "Removing cron jobs..."
    
    # Remove monitoring script
    rm -f /usr/local/bin/salini-monitor.sh
    
    # Remove cron entries
    crontab -l 2>/dev/null | grep -v "salini-monitor.sh" | crontab - 2>/dev/null || warning "No cron jobs to remove"
    
    log "Cron jobs removed."
}

# Remove log rotation configuration
remove_log_rotation() {
    log "Removing log rotation configuration..."
    
    rm -f /etc/logrotate.d/salini-ams
    
    log "Log rotation configuration removed."
}

# Reset firewall
reset_firewall() {
    log "Resetting firewall..."
    
    # Reset UFW to default
    ufw --force reset
    ufw --force enable
    ufw allow ssh
    
    log "Firewall reset."
}

# Clean system logs
clean_system_logs() {
    log "Cleaning system logs..."
    
    # Clear journal logs
    journalctl --vacuum-time=1d
    
    # Clear old log files
    find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true
    
    log "System logs cleaned."
}

# Remove temporary files
remove_temp_files() {
    log "Removing temporary files..."
    
    # Clear temporary directories
    rm -rf /tmp/*
    rm -rf /var/tmp/*
    
    # Clear package cache
    rm -rf /var/cache/apt/archives/*
    
    log "Temporary files removed."
}

# Update system
update_system() {
    log "Updating system packages..."
    
    apt update
    apt upgrade -y
    
    log "System updated."
}

# Show cleanup summary
show_summary() {
    log "Cleanup completed successfully!"
    echo ""
    info "The following have been removed:"
    echo "  ✓ Application files and directories"
    echo "  ✓ All services and configurations"
    echo "  ✓ Database and user data"
    echo "  ✓ Installed packages (.NET, Node.js, PostgreSQL, Nginx)"
    echo "  ✓ Repository configurations"
    echo "  ✓ Log files and backups"
    echo "  ✓ Cron jobs and monitoring"
    echo "  ✓ Firewall rules (reset to default)"
    echo ""
    info "The droplet is now clean and ready for a fresh deployment."
    echo ""
    warning "Next steps:"
    echo "  1. Run the setup script: sudo ./deploy/scripts/setup-server.sh"
    echo "  2. Configure your domain and settings"
    echo "  3. Run the deployment script: ./deploy/scripts/deploy.sh"
}

# Main cleanup function
main() {
    log "Starting droplet cleanup for Salini AMS..."
    
    confirm_cleanup
    stop_services
    remove_application_files
    remove_systemd_services
    remove_nginx_config
    remove_database
    remove_packages
    remove_repositories
    remove_users
    remove_cron_jobs
    remove_log_rotation
    reset_firewall
    clean_system_logs
    remove_temp_files
    update_system
    show_summary
}

# Run main function
main "$@"
