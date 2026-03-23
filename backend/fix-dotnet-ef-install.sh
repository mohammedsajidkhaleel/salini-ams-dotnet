#!/bin/bash
# Script to fix dotnet-ef tool installation issues

echo "=== Fixing dotnet-ef Installation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Step 1: Removing existing dotnet-ef installation..."
if dotnet tool list --global | grep -q "dotnet-ef"; then
    echo "Uninstalling existing dotnet-ef..."
    dotnet tool uninstall --global dotnet-ef 2>/dev/null || true
    echo -e "${GREEN}Removed${NC}"
else
    echo -e "${YELLOW}No existing installation found${NC}"
fi

echo ""
echo "Step 2: Cleaning NuGet cache..."
dotnet nuget locals all --clear
echo -e "${GREEN}Cache cleared${NC}"

echo ""
echo "Step 3: Removing tool directories..."
rm -rf ~/.dotnet/tools/.store/dotnet-ef 2>/dev/null || true
rm -rf ~/.nuget/packages/dotnet-ef* 2>/dev/null || true
echo -e "${GREEN}Directories cleaned${NC}"

echo ""
echo "Step 4: Installing dotnet-ef with specific version..."
if dotnet tool install --global dotnet-ef --version 8.0.11; then
    echo -e "${GREEN}Installation successful!${NC}"
else
    echo -e "${YELLOW}Trying with version 8.0.0...${NC}"
    if dotnet tool install --global dotnet-ef --version 8.0.0; then
        echo -e "${GREEN}Installation successful!${NC}"
    else
        echo -e "${YELLOW}Trying latest version...${NC}"
        if dotnet tool install --global dotnet-ef; then
            echo -e "${GREEN}Installation successful!${NC}"
        else
            echo -e "${RED}Installation failed. Trying alternative method...${NC}"
            echo ""
            echo "Attempting to install via NuGet package directly..."
            # Alternative: install via package
            dotnet tool install --global dotnet-ef --add-source https://api.nuget.org/v3/index.json
        fi
    fi
fi

echo ""
echo "Step 5: Adding to PATH..."
export PATH="$PATH:$HOME/.dotnet/tools"
if ! grep -q "\$HOME/.dotnet/tools" ~/.bashrc 2>/dev/null; then
    echo 'export PATH="$PATH:$HOME/.dotnet/tools"' >> ~/.bashrc
    echo -e "${GREEN}Added to ~/.bashrc${NC}"
else
    echo -e "${YELLOW}Already in ~/.bashrc${NC}"
fi

echo ""
echo "Step 6: Verifying installation..."
source ~/.bashrc 2>/dev/null || true
if dotnet ef --version 2>/dev/null; then
    echo -e "${GREEN}✓ dotnet-ef is working!${NC}"
    dotnet ef --version
else
    echo -e "${RED}✗ dotnet-ef still not working${NC}"
    echo ""
    echo "Trying to use full path..."
    if [ -f "$HOME/.dotnet/tools/dotnet-ef" ]; then
        echo "Tool exists at: $HOME/.dotnet/tools/dotnet-ef"
        echo "Try running: $HOME/.dotnet/tools/dotnet-ef --version"
    fi
    echo ""
    echo "Alternative: Install as local tool in your project"
    echo "  cd /var/www/ams/api"
    echo "  dotnet new tool-manifest"
    echo "  dotnet tool install dotnet-ef"
    echo "  dotnet tool run dotnet-ef -- database update ..."
fi

echo ""
echo "=== Fix Complete ==="


