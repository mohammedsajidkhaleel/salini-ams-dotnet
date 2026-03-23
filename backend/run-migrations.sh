#!/bin/bash
# Script to run database migrations manually
# This script can be used when .NET SDK tools are not available

echo "=== Salini AMS Database Migration Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Note: Running as non-root user. Some commands may require sudo.${NC}"
fi

API_DIR="/var/www/ams/api"
INFRASTRUCTURE_PROJECT="salini.api.Infrastructure"
STARTUP_PROJECT="salini.api.API"

# Check if API directory exists
if [ ! -d "$API_DIR" ]; then
    echo -e "${RED}Error: API directory not found at $API_DIR${NC}"
    echo "Please update the API_DIR variable in this script to match your deployment path."
    exit 1
fi

cd "$API_DIR" || exit 1

echo "Current directory: $(pwd)"
echo ""

# Check if .NET is available
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}Error: .NET runtime not found.${NC}"
    echo "Please install .NET 8.0 Runtime or SDK."
    exit 1
fi

echo "Checking .NET version..."
dotnet --version
echo ""

# Check if EF tools are installed
echo "Checking for Entity Framework Core tools..."
if ! dotnet ef --version &> /dev/null; then
    echo -e "${YELLOW}EF Core tools not found. Installing...${NC}"
    
    # Try to install EF tools
    if dotnet tool install --global dotnet-ef &> /dev/null; then
        echo -e "${GREEN}EF Core tools installed successfully${NC}"
    else
        echo -e "${RED}Failed to install EF Core tools.${NC}"
        echo ""
        echo "You need .NET SDK to install EF tools. Options:"
        echo "1. Install .NET SDK on this machine"
        echo "2. Run migrations from a development machine with SDK"
        echo "3. Use the SQL script approach (see below)"
        exit 1
    fi
else
    echo -e "${GREEN}EF Core tools are available${NC}"
    dotnet ef --version
fi

echo ""
echo "Checking database connection..."
echo "Please ensure:"
echo "  - PostgreSQL is running"
echo "  - Connection string in appsettings.Production.json is correct"
echo "  - Database user has CREATE/ALTER permissions"
echo ""

# Find the Infrastructure project
INFRASTRUCTURE_PATH=""
if [ -d "../salini.api.Infrastructure" ]; then
    INFRASTRUCTURE_PATH="../salini.api.Infrastructure"
elif [ -d "salini.api.Infrastructure" ]; then
    INFRASTRUCTURE_PATH="salini.api.Infrastructure"
else
    echo -e "${YELLOW}Warning: Could not find Infrastructure project in expected locations.${NC}"
    echo "Please specify the path to salini.api.Infrastructure project:"
    read -r INFRASTRUCTURE_PATH
fi

if [ ! -d "$INFRASTRUCTURE_PATH" ]; then
    echo -e "${RED}Error: Infrastructure project not found at $INFRASTRUCTURE_PATH${NC}"
    exit 1
fi

echo ""
echo "Running database migrations..."
echo "Infrastructure project: $INFRASTRUCTURE_PATH"
echo "Startup project: $(pwd)"
echo ""

# Set environment to Production to use production connection string
export ASPNETCORE_ENVIRONMENT=Production

# Run migrations
if dotnet ef database update --project "$INFRASTRUCTURE_PATH" --startup-project . --verbose; then
    echo ""
    echo -e "${GREEN}=== Migrations Applied Successfully ===${NC}"
else
    echo ""
    echo -e "${RED}=== Migration Failed ===${NC}"
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "1. Database connection failed - check connection string"
    echo "2. Database user lacks permissions - grant CREATE/ALTER permissions"
    echo "3. Database doesn't exist - create it first"
    exit 1
fi

echo ""
echo "Verifying migrations..."
if dotnet ef migrations list --project "$INFRASTRUCTURE_PATH" --startup-project . &> /dev/null; then
    echo "Applied migrations:"
    dotnet ef migrations list --project "$INFRASTRUCTURE_PATH" --startup-project .
fi

echo ""
echo -e "${GREEN}=== Migration Process Complete ===${NC}"


