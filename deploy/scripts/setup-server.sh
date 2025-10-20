#!/bin/bash

# Digital Ocean Droplet Setup Script for Salini AMS
# This script sets up a fresh Ubuntu server with all required dependencies

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

# Update system
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates
    log "System updated successfully."
}

# Install .NET 8
install_dotnet() {
    log "Installing .NET 8 SDK..."
    
    # Add Microsoft package repository
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb
    
    # Install .NET 8 SDK
    apt update
    apt install -y dotnet-sdk-8.0
    
    # Verify installation
    dotnet --version
    log ".NET 8 SDK installed successfully."
}

# Install Node.js and npm
install_nodejs() {
    log "Installing Node.js and npm..."
    
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    log "Node.js and npm installed successfully."
}

# Install PM2
install_pm2() {
    log "Installing PM2..."
    npm install -g pm2
    pm2 --version
    log "PM2 installed successfully."
}

# Install PostgreSQL
install_postgresql() {
    log "Installing PostgreSQL..."
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE salini_ams_prod;
CREATE USER salini_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE salini_ams_prod TO salini_user;
ALTER USER salini_user CREATEDB;
\q
EOF
    
    log "PostgreSQL installed and configured successfully."
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    
    apt install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    log "Nginx installed successfully."
}

# Install SSL certificates (Let's Encrypt)
install_ssl() {
    log "Installing Certbot for SSL certificates..."
    
    apt install -y certbot python3-certbot-nginx
    
    info "To obtain SSL certificates, run:"
    info "sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
    
    log "Certbot installed successfully."
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'
    
    # Show status
    ufw status
    log "Firewall configured successfully."
}

# Create application user and directories
setup_application() {
    log "Setting up application user and directories..."
    
    # Create www-data user if it doesn't exist
    if ! id "www-data" &>/dev/null; then
        useradd -r -s /bin/false www-data
    fi
    
    # Create application directories
    mkdir -p /var/www/salini-ams
    mkdir -p /var/log/pm2
    mkdir -p /var/backups/salini-ams
    
    # Set permissions
    chown -R www-data:www-data /var/www/salini-ams
    chown -R www-data:www-data /var/log/pm2
    
    log "Application directories created successfully."
}

# Install additional tools
install_tools() {
    log "Installing additional tools..."
    
    apt install -y \
        git \
        htop \
        unzip \
        zip \
        fail2ban \
        logrotate \
        rsync
    
    # Configure fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "Additional tools installed successfully."
}

# Configure log rotation
configure_log_rotation() {
    log "Configuring log rotation..."
    
    cat > /etc/logrotate.d/salini-ams << EOF
/var/www/salini-ams/backend/salini.api.API/logs/*.txt {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload salini-api.service
    endscript
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    log "Log rotation configured successfully."
}

# Set up monitoring
setup_monitoring() {
    log "Setting up basic monitoring..."
    
    # Create a simple monitoring script
    cat > /usr/local/bin/salini-monitor.sh << 'EOF'
#!/bin/bash

# Simple monitoring script for Salini AMS
LOG_FILE="/var/log/salini-monitor.log"

check_service() {
    local service_name=$1
    if systemctl is-active --quiet $service_name; then
        echo "$(date): $service_name is running" >> $LOG_FILE
    else
        echo "$(date): $service_name is not running - attempting restart" >> $LOG_FILE
        systemctl restart $service_name
    fi
}

check_service salini-api.service
check_service nginx
check_service postgresql

# Check PM2 processes
if pm2 list | grep -q "salini-frontend.*online"; then
    echo "$(date): salini-frontend is running" >> $LOG_FILE
else
    echo "$(date): salini-frontend is not running - attempting restart" >> $LOG_FILE
    cd /var/www/salini-ams && sudo -u www-data pm2 restart salini-frontend
fi
EOF
    
    chmod +x /usr/local/bin/salini-monitor.sh
    
    # Add to crontab to run every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/salini-monitor.sh") | crontab -
    
    log "Monitoring setup completed."
}

# Main setup function
main() {
    log "Starting Digital Ocean droplet setup for Salini AMS..."
    
    update_system
    install_dotnet
    install_nodejs
    install_pm2
    install_postgresql
    install_nginx
    install_ssl
    configure_firewall
    setup_application
    install_tools
    configure_log_rotation
    setup_monitoring
    
    log "Server setup completed successfully!"
    
    info "Next steps:"
    info "1. Update the domain name in nginx configuration"
    info "2. Obtain SSL certificates: sudo certbot --nginx -d your-domain.com"
    info "3. Update database connection strings in appsettings.json"
    info "4. Deploy your application using the deploy script"
    info "5. Configure your domain's DNS to point to this server's IP"
    
    warning "Remember to:"
    warning "- Change the default PostgreSQL password"
    warning "- Update JWT secret key in appsettings.json"
    warning "- Configure CORS allowed origins"
    warning "- Set up proper backup procedures"
}

# Run main function
main "$@"
