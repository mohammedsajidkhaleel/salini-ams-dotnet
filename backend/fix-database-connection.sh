#!/bin/bash
# Script to diagnose and fix database connection string issues

echo "=== Salini AMS Database Connection Fix ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

SERVICE_FILE="/etc/systemd/system/ams-api.service"
APP_SETTINGS="/var/www/ams/api/appsettings.Production.json"

echo "Step 1: Checking current configuration..."
echo ""

# Check service file
echo "Checking systemd service file..."
if [ -f "$SERVICE_FILE" ]; then
    echo -e "${GREEN}Service file exists${NC}"
    CONN_STR_ENV=$(grep -i "ConnectionStrings__DefaultConnection" "$SERVICE_FILE" | grep -v "^#")
    if [ -z "$CONN_STR_ENV" ]; then
        echo -e "${YELLOW}No connection string found in service file (commented out or missing)${NC}"
    else
        echo -e "${GREEN}Connection string found in service file:${NC}"
        echo "$CONN_STR_ENV"
        # Check if password is present
        if echo "$CONN_STR_ENV" | grep -q "Password="; then
            echo -e "${GREEN}Password parameter found${NC}"
        else
            echo -e "${RED}WARNING: Password parameter missing!${NC}"
        fi
    fi
else
    echo -e "${RED}Service file not found at $SERVICE_FILE${NC}"
fi

echo ""
echo "Checking appsettings.Production.json..."
if [ -f "$APP_SETTINGS" ]; then
    echo -e "${GREEN}appsettings.Production.json exists${NC}"
    CONN_STR_JSON=$(grep -A 2 "ConnectionStrings" "$APP_SETTINGS" | grep "DefaultConnection" | head -1)
    if [ -z "$CONN_STR_JSON" ]; then
        echo -e "${RED}No connection string found in appsettings.Production.json${NC}"
    else
        echo -e "${GREEN}Connection string found:${NC}"
        echo "$CONN_STR_JSON"
        # Check if password is present
        if echo "$CONN_STR_JSON" | grep -q "Password="; then
            echo -e "${GREEN}Password parameter found${NC}"
        else
            echo -e "${RED}WARNING: Password parameter missing!${NC}"
        fi
    fi
else
    echo -e "${RED}appsettings.Production.json not found at $APP_SETTINGS${NC}"
fi

echo ""
echo "Step 2: Testing database connection..."
echo "Please enter the PostgreSQL password for user 'ams':"
read -s DB_PASSWORD

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Password cannot be empty${NC}"
    exit 1
fi

# Test connection
echo ""
echo "Testing database connection..."
export PGPASSWORD="$DB_PASSWORD"
if psql -h localhost -U ams -d ams -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}Database connection successful!${NC}"
else
    echo -e "${RED}Database connection failed!${NC}"
    echo "Please verify:"
    echo "  1. PostgreSQL is running: sudo systemctl status postgresql"
    echo "  2. Database 'ams' exists"
    echo "  3. User 'ams' exists and has correct password"
    echo "  4. User has permissions on database"
    exit 1
fi
unset PGPASSWORD

echo ""
echo "Step 3: Fixing configuration..."
echo ""
echo "Choose how to set the connection string:"
echo "1) Set in systemd service file (recommended - more secure)"
echo "2) Set in appsettings.Production.json"
echo "3) Set in both"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "Updating systemd service file..."
        # Remove any existing connection string line (commented or not)
        sed -i '/ConnectionStrings__DefaultConnection/d' "$SERVICE_FILE"
        # Add new connection string before Timeout settings
        sed -i "/Timeout settings/i Environment=ConnectionStrings__DefaultConnection=\"Host=localhost;Database=ams;Username=ams;Password=$DB_PASSWORD;Port=5432\"" "$SERVICE_FILE"
        echo -e "${GREEN}Service file updated${NC}"
        ;;
    2)
        echo "Updating appsettings.Production.json..."
        # Create backup
        cp "$APP_SETTINGS" "${APP_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
        # Update connection string using Python or sed
        python3 << EOF
import json
import sys

try:
    with open('$APP_SETTINGS', 'r') as f:
        config = json.load(f)
    
    config['ConnectionStrings']['DefaultConnection'] = f"Host=localhost;Database=ams;Username=ams;Password=$DB_PASSWORD;Port=5432"
    
    with open('$APP_SETTINGS', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Configuration updated successfully")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}appsettings.Production.json updated${NC}"
        else
            echo -e "${RED}Failed to update appsettings.Production.json${NC}"
            exit 1
        fi
        ;;
    3)
        echo "Updating both files..."
        # Update service file
        sed -i '/ConnectionStrings__DefaultConnection/d' "$SERVICE_FILE"
        sed -i "/Timeout settings/i Environment=ConnectionStrings__DefaultConnection=\"Host=localhost;Database=ams;Username=ams;Password=$DB_PASSWORD;Port=5432\"" "$SERVICE_FILE"
        # Update appsettings
        cp "$APP_SETTINGS" "${APP_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
        python3 << EOF
import json
import sys

try:
    with open('$APP_SETTINGS', 'r') as f:
        config = json.load(f)
    
    config['ConnectionStrings']['DefaultConnection'] = f"Host=localhost;Database=ams;Username=ams;Password=$DB_PASSWORD;Port=5432"
    
    with open('$APP_SETTINGS', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Configuration updated successfully")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF
        echo -e "${GREEN}Both files updated${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Step 4: Reloading and restarting service..."
systemctl daemon-reload
systemctl restart ams-api.service

echo ""
echo "Step 5: Checking service status..."
sleep 2
systemctl status ams-api.service --no-pager -l

echo ""
echo "Step 6: Checking logs for errors..."
echo "Recent logs (last 20 lines):"
journalctl -u ams-api.service -n 20 --no-pager

echo ""
echo -e "${GREEN}=== Fix Complete ===${NC}"
echo "If you still see errors, check the logs with:"
echo "  sudo journalctl -u ams-api.service -f"

