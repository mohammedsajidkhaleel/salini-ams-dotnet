# Droplet Cleanup Guide

This guide provides two cleanup options for your Digital Ocean droplet to avoid deployment issues.

## 🧹 Cleanup Options

### Option 1: Complete Cleanup (Recommended for Fresh Start)

**Script:** `deploy/scripts/cleanup-droplet.sh`

**What it removes:**
- ✅ All application files and directories
- ✅ All services and configurations  
- ✅ All databases and user data
- ✅ All logs and backups
- ✅ All installed packages (.NET, Node.js, PostgreSQL, Nginx)
- ✅ Repository configurations
- ✅ Cron jobs and monitoring
- ✅ Firewall rules (reset to default)

**When to use:**
- Starting completely fresh
- Having persistent issues
- Want to ensure no conflicts
- First-time deployment

**Usage:**
```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Navigate to your project
cd /var/www/salini-ams

# Make script executable and run
chmod +x deploy/scripts/cleanup-droplet.sh
sudo ./deploy/scripts/cleanup-droplet.sh
```

### Option 2: Application-Only Cleanup (Faster)

**Script:** `deploy/scripts/cleanup-app-only.sh`

**What it removes:**
- ✅ Application files and directories
- ✅ Application services and configurations
- ✅ Application database and user data
- ✅ Application logs and backups
- ✅ Application cron jobs and monitoring

**What it keeps:**
- ✅ .NET SDK and runtime
- ✅ Node.js and npm
- ✅ PostgreSQL server
- ✅ Nginx web server
- ✅ System packages and tools

**When to use:**
- Quick redeployment
- Packages are working fine
- Just need to clean application data
- Faster cleanup process

**Usage:**
```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Navigate to your project
cd /var/www/salini-ams

# Make script executable and run
chmod +x deploy/scripts/cleanup-app-only.sh
sudo ./deploy/scripts/cleanup-app-only.sh
```

## 🚀 After Cleanup

### For Complete Cleanup:
1. **Run setup script:**
   ```bash
   sudo ./deploy/scripts/setup-server.sh
   ```

2. **Configure your settings:**
   - Update domain in nginx config
   - Update database passwords
   - Update JWT secrets

3. **Deploy application:**
   ```bash
   ./deploy/scripts/deploy.sh
   ```

### For Application-Only Cleanup:
1. **Upload your code** (if not already there)
2. **Configure your settings**
3. **Deploy application:**
   ```bash
   ./deploy/scripts/deploy.sh
   ```

## ⚠️ Important Notes

### Before Running Cleanup:
- **Backup important data** if needed
- **Note down your configurations** (passwords, domains, etc.)
- **Ensure you have access** to your droplet

### Safety Features:
- Both scripts require **confirmation** before proceeding
- Complete cleanup requires typing **"YES"** to confirm
- Application-only cleanup requires **"y"** to confirm
- Scripts will **stop services gracefully** before removal

### What Gets Preserved:
- **SSH access** and user accounts
- **System packages** (in app-only cleanup)
- **Network configuration**
- **Basic system settings**

## 🔧 Troubleshooting

### If cleanup fails:
1. **Check permissions:** Ensure running as root
2. **Check file paths:** Verify scripts exist
3. **Manual cleanup:** Follow individual steps from scripts
4. **Check logs:** Look for specific error messages

### If services won't start after cleanup:
1. **Verify packages installed:** Check if .NET, Node.js, etc. are present
2. **Check configurations:** Ensure all config files are correct
3. **Check permissions:** Verify file ownership and permissions
4. **Check logs:** Review service logs for errors

## 📋 Quick Commands Reference

```bash
# Check what's installed
dotnet --version
node --version
npm --version
systemctl status postgresql
systemctl status nginx

# Check running services
systemctl list-units --type=service --state=running
pm2 list

# Check disk space
df -h

# Check memory usage
free -h

# View logs
journalctl -u salini-api.service -f
pm2 logs
tail -f /var/log/nginx/error.log
```

## 🆘 Emergency Recovery

If something goes wrong during cleanup:

1. **Don't panic** - the system is still accessible via SSH
2. **Check what's still working:**
   ```bash
   systemctl status ssh
   systemctl status networking
   ```
3. **Reinstall packages manually** if needed
4. **Restore from backup** if you have one
5. **Contact support** if needed

---

**Remember:** Always test cleanup scripts on a non-production environment first if possible!
