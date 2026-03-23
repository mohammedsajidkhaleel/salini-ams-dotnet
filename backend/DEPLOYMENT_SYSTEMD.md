# Systemd Service Deployment Guide

## Problem: Service Timeout During Startup

The application was experiencing frequent restarts due to systemd timeout during startup. This was caused by:
1. Blocking database operations during startup (seeding and EnsureCreated)
2. Default systemd timeout (90 seconds) being too short
3. Database operations taking longer than expected

## Solution

### 1. Optimized Startup Sequence

The application startup has been optimized:
- Database seeding now runs asynchronously after the app starts (non-blocking)
- Removed redundant `EnsureCreated()` call (use migrations instead)
- Application starts listening immediately, allowing systemd to detect it's ready

### 2. Updated Systemd Service File

A new systemd service file (`ams-api.service`) has been created with:
- **Increased timeout**: `TimeoutStartSec=300` (5 minutes) to allow for slow database operations
- **Proper restart policy**: `Restart=always` with 10-second delay
- **Resource limits**: Increased file descriptor limit
- **Security settings**: NoNewPrivileges and PrivateTmp

## Deployment Steps

### 1. Copy Service File to Server

```bash
# On your server
sudo cp ams-api.service /etc/systemd/system/ams-api.service
```

### 2. Update Service File Paths and Database Connection

Edit the service file to match your deployment:
```bash
sudo nano /etc/systemd/system/ams-api.service
```

Update these paths if different:
- `WorkingDirectory=/var/www/ams/api`
- `ExecStart=/usr/bin/dotnet /var/www/ams/api/salini.api.API.dll`
- `User=deploy` (or your deployment user)
- `Group=deploy` (or your deployment group)

**IMPORTANT: Configure Database Connection String**

You have two options:

**Option 1: Use Environment Variable (Recommended for Security)**
Uncomment and set the connection string in the service file:
```ini
Environment=ConnectionStrings__DefaultConnection="Host=localhost;Database=ams;Username=ams;Password=your_actual_password;Port=5432"
```

**Option 2: Update appsettings.Production.json**
Ensure `/var/www/ams/api/appsettings.Production.json` has the correct connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=ams;Username=ams;Password=your_actual_password;Port=5432"
  }
}
```

**Note:** Replace `your_actual_password` with your actual PostgreSQL password.

### 3. Run Database Migrations

Before starting the service, ensure the database is created and migrations are applied:
```bash
cd /var/www/ams/api
dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
```

If you get an error about missing EF tools, install them:
```bash
dotnet tool install --global dotnet-ef
```

### 4. Reload Systemd and Start Service

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable ams-api.service

# Start the service
sudo systemctl start ams-api.service

# Check status
sudo systemctl status ams-api.service
```

### 5. Monitor Logs

```bash
# View live logs
sudo journalctl -u ams-api.service -f

# View recent logs
sudo journalctl -u ams-api.service -n 100

# View logs since boot
sudo journalctl -u ams-api.service -b
```

## Verification

After deployment, verify:

1. **Service is running**:
   ```bash
   sudo systemctl status ams-api.service
   ```
   Should show: `Active: active (running)`

2. **No timeout errors**:
   ```bash
   sudo journalctl -u ams-api.service | grep -i timeout
   ```
   Should show no timeout errors

3. **Application is responding**:
   ```bash
   curl http://localhost:5000/health
   ```

4. **CORS is working**:
   Check logs for "CORS policy execution successful" instead of "CORS policy execution failed"

## Troubleshooting

### Service Still Timing Out

If you still see timeout errors:

1. **Check database connectivity**:
   ```bash
   # Test PostgreSQL connection
   psql -h localhost -U ams -d ams
   ```

2. **Increase timeout further**:
   ```bash
   sudo nano /etc/systemd/system/ams-api.service
   # Change TimeoutStartSec=300 to TimeoutStartSec=600
   sudo systemctl daemon-reload
   sudo systemctl restart ams-api.service
   ```

3. **Check for slow database operations**:
   ```bash
   sudo journalctl -u ams-api.service | grep -i "database\|seed\|migration"
   ```

### Service Keeps Restarting

1. **Check for errors**:
   ```bash
   sudo journalctl -u ams-api.service -p err
   ```

2. **Check application logs**:
   ```bash
   tail -f /var/www/ams/api/logs/salini-api-*.txt
   ```

3. **Verify file permissions**:
   ```bash
   ls -la /var/www/ams/api/
   # Ensure deploy user has read/execute permissions
   ```

### Database Connection Issues

1. **Verify connection string**:
   - Check `/var/www/ams/api/appsettings.Production.json` OR
   - Check environment variable in service file: `sudo systemctl cat ams-api.service | grep ConnectionStrings`
   
2. **Test database connection manually**:
   ```bash
   # Test PostgreSQL connection with the credentials from your connection string
   psql -h localhost -U ams -d ams
   # Enter password when prompted
   ```
   
3. **Verify connection string format**:
   The connection string must include all required parameters:
   ```
   Host=localhost;Database=ams;Username=ams;Password=your_password;Port=5432
   ```
   **Common issues:**
   - Missing `Password=` parameter
   - Incorrect password
   - Database doesn't exist
   - User doesn't have permissions
   
4. **Test PostgreSQL is running**:
   ```bash
   sudo systemctl status postgresql
   ```
   
5. **Check PostgreSQL logs**:
   ```bash
   sudo journalctl -u postgresql -n 50
   ```
   
6. **Create database and user if needed**:
   ```bash
   sudo -u postgres psql
   ```
   Then in PostgreSQL:
   ```sql
   CREATE DATABASE ams;
   CREATE USER ams WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ams TO ams;
   \q
   ```

## Service Management Commands

```bash
# Start service
sudo systemctl start ams-api.service

# Stop service
sudo systemctl stop ams-api.service

# Restart service
sudo systemctl restart ams-api.service

# Reload configuration (no downtime)
sudo systemctl reload ams-api.service

# Check status
sudo systemctl status ams-api.service

# View logs
sudo journalctl -u ams-api.service -f

# Disable auto-start on boot
sudo systemctl disable ams-api.service

# Enable auto-start on boot
sudo systemctl enable ams-api.service
```

## Quick Fix for "No password has been provided" Error

If you're seeing this error:
```
Npgsql.NpgsqlException: No password has been provided but the backend requires one
```

**Solution:**

1. **Check your connection string** in the service file:
   ```bash
   sudo systemctl cat ams-api.service | grep ConnectionStrings
   ```

2. **If not set, add it to the service file**:
   ```bash
   sudo nano /etc/systemd/system/ams-api.service
   ```
   Uncomment and update this line:
   ```ini
   Environment=ConnectionStrings__DefaultConnection="Host=localhost;Database=ams;Username=ams;Password=YOUR_ACTUAL_PASSWORD;Port=5432"
   ```

3. **OR update appsettings.Production.json**:
   ```bash
   sudo nano /var/www/ams/api/appsettings.Production.json
   ```
   Ensure it has:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=ams;Username=ams;Password=YOUR_ACTUAL_PASSWORD;Port=5432"
     }
   }
   ```

4. **Reload and restart**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ams-api.service
   ```

## Notes

- The service file assumes PostgreSQL service name is `postgresql.service`. Adjust if different.
- Database migrations should be run manually before starting the service:
  ```bash
  cd /var/www/ams/api
  dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API
  ```
- The service runs as user `deploy`. Ensure this user exists and has proper permissions.
- **Never commit passwords to version control**. Use environment variables or secure configuration management.

