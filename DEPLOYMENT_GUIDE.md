# Salini AMS Deployment Guide - Digital Ocean Droplet

This guide will walk you through deploying the Salini AMS application to a Digital Ocean droplet using Nginx as a reverse proxy.

## Prerequisites

- A Digital Ocean droplet with Ubuntu 22.04 LTS
- A domain name pointing to your droplet's IP address
- SSH access to your droplet
- Basic knowledge of Linux command line

## Architecture Overview

```
Internet → Nginx (Port 80/443) → Next.js Frontend (Port 3000) + .NET API (Port 5000)
                                ↓
                            PostgreSQL Database
```

## Step 1: Create Digital Ocean Droplet

1. Log in to your Digital Ocean account
2. Create a new droplet with the following specifications:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: At least 2GB RAM, 2 vCPUs (recommended: 4GB RAM, 2 vCPUs)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: salini-ams-prod (or your preferred name)

3. Note down your droplet's IP address

## Step 2: Configure Domain DNS

1. Point your domain's A record to your droplet's IP address
2. Create a CNAME record for www subdomain pointing to your main domain
3. Wait for DNS propagation (can take up to 24 hours, usually much faster)

## Step 3: Initial Server Setup

1. Connect to your droplet via SSH:
   ```bash
   ssh root@your-droplet-ip
   ```

2. Make the setup script executable and run it:
   ```bash
   chmod +x deploy/scripts/setup-server.sh
   sudo ./deploy/scripts/setup-server.sh
   ```

   This script will install:
   - .NET 8 SDK
   - Node.js 20.x and npm
   - PM2 process manager
   - PostgreSQL database
   - Nginx web server
   - Certbot for SSL certificates
   - Additional tools and security configurations

## Step 4: Configure Database

1. Update the PostgreSQL password:
   ```bash
   sudo -u postgres psql
   ```
   
   ```sql
   ALTER USER salini_user PASSWORD 'your_very_secure_password';
   \q
   ```

2. Update the connection string in `deploy/environment/appsettings.Production.json`:
   ```json
   "DefaultConnection": "Host=localhost;Database=salini_ams_prod;Username=salini_user;Password=your_very_secure_password;Port=5432;"
   ```

## Step 5: Configure Application Settings

1. Update the production configuration files:

   **Backend Configuration** (`deploy/environment/appsettings.Production.json`):
   - Update database connection string
   - Change JWT secret to a secure random string
   - Update CORS allowed origins with your domain

   **Frontend Configuration** (`deploy/environment/env.production`):
   - Update `NEXT_PUBLIC_API_URL` with your domain
   - Copy this file to `client/.env.local`

2. Update Nginx configuration (`deploy/nginx/salini-ams.conf`):
   - Replace `your-domain.com` with your actual domain
   - Update SSL certificate paths if using custom certificates

## Step 6: Obtain SSL Certificate

1. Install SSL certificate using Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

2. Test automatic renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

## Step 7: Deploy Application

1. Upload your application code to the server (using git, scp, or rsync):
   ```bash
   # Using git (recommended)
   git clone https://github.com/your-username/salini-ams.git /var/www/salini-ams
   
   # Or using rsync from your local machine
   rsync -avz --exclude node_modules --exclude bin --exclude obj ./ root@your-droplet-ip:/var/www/salini-ams/
   ```

2. Copy production configuration files:
   ```bash
   cp deploy/environment/appsettings.Production.json backend/salini.api.API/appsettings.Production.json
   cp deploy/environment/env.production client/.env.local
   ```

3. Run the deployment script:
   ```bash
   chmod +x deploy/scripts/deploy.sh
   ./deploy/scripts/deploy.sh
   ```

## Step 8: Verify Deployment

1. Check service status:
   ```bash
   sudo systemctl status salini-api.service
   sudo systemctl status nginx
   pm2 status
   ```

2. Test the application:
   - Visit `https://your-domain.com` - should show the frontend
   - Visit `https://your-domain.com/api/health` - should return health status
   - Visit `https://your-domain.com/swagger` - should show API documentation

3. Check logs if there are issues:
   ```bash
   # API logs
   sudo journalctl -u salini-api.service -f
   
   # Frontend logs
   pm2 logs salini-frontend
   
   # Nginx logs
   sudo tail -f /var/log/nginx/salini-ams.access.log
   sudo tail -f /var/log/nginx/salini-ams.error.log
   ```

## Step 9: Database Migration

1. Run database migrations:
   ```bash
   cd /var/www/salini-ams/backend/salini.api.API
   sudo -u www-data dotnet ef database update
   ```

2. Seed initial data (if needed):
   ```bash
   # The application should automatically seed data on first run
   # Check logs to confirm seeding was successful
   ```

## Step 10: Security Hardening

1. Update firewall rules if needed:
   ```bash
   sudo ufw status
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

2. Configure fail2ban for additional security:
   ```bash
   sudo systemctl status fail2ban
   ```

3. Set up regular backups:
   ```bash
   # Create backup script
   sudo crontab -e
   # Add: 0 2 * * * /usr/local/bin/backup-salini-ams.sh
   ```

## Monitoring and Maintenance

### Health Monitoring

The deployment includes a monitoring script that runs every 5 minutes to check service health. You can view monitoring logs:

```bash
tail -f /var/log/salini-monitor.log
```

### Log Management

Logs are automatically rotated and kept for 30 days:
- API logs: `/var/www/salini-ams/backend/salini.api.API/logs/`
- Frontend logs: `/var/log/pm2/`
- Nginx logs: `/var/log/nginx/`

### Updates and Maintenance

To update the application:

1. Stop services:
   ```bash
   sudo systemctl stop salini-api.service
   pm2 stop salini-frontend
   ```

2. Update code and run deployment script:
   ```bash
   ./deploy/scripts/deploy.sh
   ```

3. Restart services (handled by deployment script)

### Backup and Recovery

1. Database backup:
   ```bash
   sudo -u postgres pg_dump salini_ams_prod > /var/backups/salini-ams/db-backup-$(date +%Y%m%d).sql
   ```

2. Application backup:
   ```bash
   sudo tar -czf /var/backups/salini-ams/app-backup-$(date +%Y%m%d).tar.gz /var/www/salini-ams
   ```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Check if .NET API is running
   ```bash
   sudo systemctl status salini-api.service
   sudo journalctl -u salini-api.service -f
   ```

2. **Frontend not loading**: Check PM2 status
   ```bash
   pm2 status
   pm2 logs salini-frontend
   ```

3. **Database connection issues**: Verify PostgreSQL is running and credentials are correct
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT version();"
   ```

4. **SSL certificate issues**: Check certificate status
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

### Performance Optimization

1. **Enable Nginx caching** (optional):
   Add caching directives to nginx configuration for static assets

2. **Database optimization**:
   - Monitor slow queries
   - Add appropriate indexes
   - Configure connection pooling

3. **Application optimization**:
   - Monitor memory usage
   - Adjust PM2 instance count if needed
   - Configure .NET garbage collection

## Security Considerations

1. **Regular updates**: Keep the system and dependencies updated
2. **Strong passwords**: Use strong passwords for all accounts
3. **SSH key authentication**: Disable password authentication for SSH
4. **Firewall**: Only open necessary ports
5. **SSL/TLS**: Always use HTTPS in production
6. **Backup strategy**: Implement regular automated backups
7. **Monitoring**: Set up monitoring and alerting

## Support

For issues or questions:
1. Check the logs first
2. Review this deployment guide
3. Check the application documentation
4. Contact the development team

---

**Note**: Remember to replace all placeholder values (like `your-domain.com`, passwords, etc.) with your actual values before deployment.
