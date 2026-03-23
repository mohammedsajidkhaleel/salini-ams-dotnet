#!/bin/bash
# Script to generate SQL migration script when .NET SDK tools are not available on production
# Run this on a development machine with .NET SDK, then execute the SQL on production

echo "=== Generate SQL Migration Script ==="
echo ""
echo "This script generates a SQL script from EF Core migrations."
echo "Run this on a development machine with .NET SDK installed."
echo "Then execute the generated SQL script on your production database."
echo ""

# Get the project root (assuming script is in backend directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

INFRASTRUCTURE_PROJECT="salini.api.Infrastructure"
STARTUP_PROJECT="salini.api.API"
OUTPUT_FILE="migration-$(date +%Y%m%d-%H%M%S).sql"

echo "Infrastructure project: $INFRASTRUCTURE_PROJECT"
echo "Startup project: $STARTUP_PROJECT"
echo "Output file: $OUTPUT_FILE"
echo ""

# Check if .NET SDK is available
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK not found."
    echo "Please install .NET 8.0 SDK to generate migration scripts."
    exit 1
fi

# Check if EF tools are installed
if ! dotnet ef --version &> /dev/null; then
    echo "Installing EF Core tools..."
    dotnet tool install --global dotnet-ef
fi

echo "Generating SQL migration script..."
echo ""

# Generate SQL script from migrations
if dotnet ef migrations script \
    --project "$INFRASTRUCTURE_PROJECT" \
    --startup-project "$STARTUP_PROJECT" \
    --output "$OUTPUT_FILE" \
    --idempotent; then
    
    echo ""
    echo "✓ SQL script generated successfully: $OUTPUT_FILE"
    echo ""
    echo "To apply this script to your production database:"
    echo ""
    echo "  psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f $OUTPUT_FILE"
    echo ""
    echo "Or copy the file to your production server and run:"
    echo "  psql -h localhost -U ams -d ams -f $OUTPUT_FILE"
    echo ""
else
    echo ""
    echo "✗ Failed to generate SQL script"
    exit 1
fi


