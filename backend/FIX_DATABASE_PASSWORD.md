# Quick Fix: "No password has been provided" Error

## Problem
You're seeing this error:
```
Npgsql.NpgsqlException: No password has been provided but the backend requires one (in SASL/SCRAM-SHA-256-PLUS)
```

This means the database connection string is missing the password parameter.

## Quick Fix (Choose One Method)

### Method 1: Use the Automated Script (Easiest)

1. **Copy the fix script to your server**:
   ```bash
   # On your local machine, copy fix-database-connection.sh to server
   scp fix-database-connection.sh user@your-server:/tmp/
   ```

2. **Run the script on the server**:
   ```bash
   ssh user@your-server
   sudo chmod +x /tmp/fix-database-connection.sh
   sudo /tmp/fix-database-connection.sh
   ```

   The script will:
   - Check your current configuration
   - Test the database connection
   - Fix the connection string
   - Restart the service

### Method 2: Manual Fix - Systemd Service File (Recommended)

**This method is more secure as it keeps the password out of config files.**

1. **Edit the service file**:
   ```bash
   sudo nano /etc/systemd/system/ams-api.service
   ```

2. **Find this line** (it's probably commented out):
   ```ini
   # Environment=ConnectionStrings__DefaultConnection="Host=localhost;Database=ams;Username=ams;Password=your_password;Port=5432"
   ```

3. **Uncomment and update it with your actual password**:
   ```ini
   Environment=ConnectionStrings__DefaultConnection="Host=localhost;Database=ams;Username=ams;Password=YOUR_ACTUAL_PASSWORD;Port=5432"
   ```

4. **Save and exit** (Ctrl+X, then Y, then Enter)

5. **Reload and restart**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ams-api.service
   ```

6. **Verify it's working**:
   ```bash
   sudo systemctl status ams-api.service
   sudo journalctl -u ams-api.service -f
   ```

### Method 3: Manual Fix - appsettings.Production.json

1. **Edit the production config file**:
   ```bash
   sudo nano /var/www/ams/api/appsettings.Production.json
   ```

2. **Ensure the connection string has a password**:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=ams;Username=ams;Password=YOUR_ACTUAL_PASSWORD;Port=5432"
     }
   }
   ```

3. **Save and exit**

4. **Restart the service**:
   ```bash
   sudo systemctl restart ams-api.service
   ```

5. **Verify it's working**:
   ```bash
   sudo journalctl -u ams-api.service -f
   ```

## Verify the Fix

After applying the fix, check:

1. **Service is running**:
   ```bash
   sudo systemctl status ams-api.service
   ```
   Should show: `Active: active (running)`

2. **No password errors in logs**:
   ```bash
   sudo journalctl -u ams-api.service | grep -i "password\|authentication"
   ```
   Should show no errors

3. **Database seeding succeeded**:
   ```bash
   sudo journalctl -u ams-api.service | grep -i "seeded successfully"
   ```
   Should show: `Database seeded successfully`

4. **Health check works**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `Healthy`

## Troubleshooting

### If you don't know the database password:

1. **Reset the PostgreSQL password**:
   ```bash
   sudo -u postgres psql
   ```
   Then in PostgreSQL:
   ```sql
   ALTER USER ams WITH PASSWORD 'new_password';
   \q
   ```

2. **Use the new password in your connection string**

### If the database user doesn't exist:

1. **Create the user**:
   ```bash
   sudo -u postgres psql
   ```
   Then in PostgreSQL:
   ```sql
   CREATE USER ams WITH PASSWORD 'your_password';
   CREATE DATABASE ams OWNER ams;
   GRANT ALL PRIVILEGES ON DATABASE ams TO ams;
   \q
   ```

### If you're not sure which method is being used:

Check what's currently configured:
```bash
# Check service file
sudo systemctl cat ams-api.service | grep ConnectionStrings

# Check appsettings
cat /var/www/ams/api/appsettings.Production.json | grep -A 2 ConnectionStrings
```

**Note:** If both are set, the environment variable in the service file takes precedence.

## Security Best Practices

1. **Use environment variables** (Method 2) instead of config files when possible
2. **Restrict file permissions**:
   ```bash
   sudo chmod 600 /etc/systemd/system/ams-api.service
   sudo chmod 600 /var/www/ams/api/appsettings.Production.json
   ```
3. **Never commit passwords to version control**
4. **Consider using a secrets management system** for production

## Still Having Issues?

1. **Check PostgreSQL is running**:
   ```bash
   sudo systemctl status postgresql
   ```

2. **Test database connection manually**:
   ```bash
   psql -h localhost -U ams -d ams
   # Enter password when prompted
   ```

3. **Check application logs**:
   ```bash
   tail -f /var/www/ams/api/logs/salini-api-*.txt
   ```

4. **View full systemd logs**:
   ```bash
   sudo journalctl -u ams-api.service -n 100 --no-pager
   ```

