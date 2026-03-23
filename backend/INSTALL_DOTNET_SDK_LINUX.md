# Installing .NET SDK on Linux

This guide explains how to install .NET 8.0 SDK on various Linux distributions.

## Quick Install (Recommended)

### Ubuntu / Debian

```bash
# Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Update package list
sudo apt-get update

# Install .NET 8.0 SDK
sudo apt-get install -y dotnet-sdk-8.0

# Verify installation
dotnet --version
```

### CentOS / RHEL / Fedora

```bash
# Add Microsoft package repository
sudo rpm -Uvh https://packages.microsoft.com/config/centos/8/packages-microsoft-prod.rpm

# For Fedora:
# sudo rpm -Uvh https://packages.microsoft.com/config/fedora/38/packages-microsoft-prod.rpm

# Install .NET 8.0 SDK
sudo dnf install -y dotnet-sdk-8.0

# Verify installation
dotnet --version
```

## Detailed Installation Steps

### Method 1: Package Manager (Recommended)

#### Ubuntu 20.04 / 22.04 / 24.04

```bash
# 1. Get the installation script
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh

# 2. Install .NET SDK
sudo ./dotnet-install.sh --channel 8.0 --install-dir /usr/share/dotnet

# 3. Add to PATH (if not already added)
export PATH=$PATH:/usr/share/dotnet

# 4. Make it permanent
echo 'export PATH=$PATH:/usr/share/dotnet' >> ~/.bashrc
source ~/.bashrc

# 5. Verify
dotnet --version
```

#### Using APT Package Manager (Ubuntu/Debian)

```bash
# 1. Get Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)

# 2. Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/${UBUNTU_VERSION}/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# 3. Update package list
sudo apt-get update

# 4. Install .NET SDK
sudo apt-get install -y dotnet-sdk-8.0

# 5. Verify installation
dotnet --version
dotnet --list-sdks
```

#### CentOS 7 / RHEL 7

```bash
# 1. Add Microsoft repository
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm

# 2. Install .NET SDK
sudo yum install -y dotnet-sdk-8.0

# 3. Verify
dotnet --version
```

#### CentOS 8+ / RHEL 8+ / Fedora

```bash
# 1. Add Microsoft repository
sudo rpm -Uvh https://packages.microsoft.com/config/centos/8/packages-microsoft-prod.rpm

# 2. Install .NET SDK
sudo dnf install -y dotnet-sdk-8.0

# 3. Verify
dotnet --version
```

### Method 2: Manual Installation Script

```bash
# Download and run the installation script
curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0 --install-dir /usr/share/dotnet

# Add to PATH
export PATH=$PATH:/usr/share/dotnet
echo 'export PATH=$PATH:/usr/share/dotnet' >> ~/.bashrc
source ~/.bashrc

# Verify
dotnet --version
```

### Method 3: Binary Installation

```bash
# 1. Download .NET SDK
cd /tmp
wget https://dotnetcli.azureedge.net/dotnet/Sdk/8.0.404/dotnet-sdk-8.0.404-linux-x64.tar.gz

# 2. Create installation directory
sudo mkdir -p /usr/share/dotnet

# 3. Extract
sudo tar -xzf dotnet-sdk-8.0.404-linux-x64.tar.gz -C /usr/share/dotnet

# 4. Add to PATH
export PATH=$PATH:/usr/share/dotnet
echo 'export PATH=$PATH:/usr/share/dotnet' >> ~/.bashrc
source ~/.bashrc

# 5. Create symlink (optional)
sudo ln -s /usr/share/dotnet/dotnet /usr/local/bin/dotnet

# 6. Verify
dotnet --version
```

## Verify Installation

After installation, verify it works:

```bash
# Check version
dotnet --version
# Should show: 8.0.xxx

# List installed SDKs
dotnet --list-sdks

# Check if EF tools can be installed
dotnet tool install --global dotnet-ef
dotnet ef --version
```

## Install Entity Framework Core Tools

After installing .NET SDK, install EF Core tools:

```bash
# Install globally
dotnet tool install --global dotnet-ef

# Verify installation
dotnet ef --version

# If you get permission errors, you may need to add to PATH:
export PATH="$PATH:$HOME/.dotnet/tools"
echo 'export PATH="$PATH:$HOME/.dotnet/tools"' >> ~/.bashrc
source ~/.bashrc
```

### Troubleshooting dotnet-ef Installation

If you get an error like "Settings file 'DotnetToolSettings.xml' was not found":

**Solution 1: Clear tool cache and reinstall**
```bash
# Remove existing tool (if partially installed)
dotnet tool uninstall --global dotnet-ef

# Clear NuGet cache
dotnet nuget locals all --clear

# Reinstall
dotnet tool install --global dotnet-ef --version 8.0.0
```

**Solution 2: Use specific version**
```bash
# Install specific version
dotnet tool install --global dotnet-ef --version 8.0.0

# Or latest 8.x version
dotnet tool install --global dotnet-ef --version 8.0.11
```

**Solution 3: Remove and clean install**
```bash
# Remove tool
dotnet tool uninstall --global dotnet-ef

# Remove tool directory
rm -rf ~/.dotnet/tools/.store/dotnet-ef

# Clear all caches
dotnet nuget locals all --clear
rm -rf ~/.nuget/packages

# Reinstall
dotnet tool install --global dotnet-ef
```

**Solution 4: Install as local tool (alternative)**
```bash
# Create tool manifest in your project
cd /var/www/ams/api
dotnet new tool-manifest

# Install locally
dotnet tool install dotnet-ef

# Use with dotnet tool run
dotnet tool run dotnet-ef -- --version
```

## Troubleshooting

### Issue: "dotnet: command not found"

**Solution**: Add dotnet to PATH
```bash
export PATH=$PATH:/usr/share/dotnet
echo 'export PATH=$PATH:/usr/share/dotnet' >> ~/.bashrc
source ~/.bashrc
```

### Issue: "Permission denied"

**Solution**: Use sudo or fix permissions
```bash
# If installed in /usr/share/dotnet, it should be accessible
# If installed in user directory, check permissions:
chmod +x ~/.dotnet/dotnet
```

### Issue: "Package not found" (Ubuntu/Debian)

**Solution**: Update package list and check repository
```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https
sudo apt-get update
```

### Issue: "Repository not found" (CentOS/RHEL)

**Solution**: Check your CentOS/RHEL version and use correct repository URL
```bash
# For CentOS 7
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm

# For CentOS 8
sudo rpm -Uvh https://packages.microsoft.com/config/centos/8/packages-microsoft-prod.rpm

# For RHEL 8
sudo rpm -Uvh https://packages.microsoft.com/config/rhel/8/packages-microsoft-prod.rpm
```

### Issue: "Conflicts with existing installation"

**Solution**: Remove old version first
```bash
# Ubuntu/Debian
sudo apt-get remove dotnet-sdk-*

# CentOS/RHEL/Fedora
sudo dnf remove dotnet-sdk-*

# Then reinstall
```

## Check Current Installation

```bash
# Check if .NET is installed
which dotnet

# Check version
dotnet --version

# List all installed SDKs
dotnet --list-sdks

# List all installed runtimes
dotnet --list-runtimes

# Check EF tools
dotnet ef --version
```

## Uninstall (if needed)

### Ubuntu/Debian
```bash
sudo apt-get remove dotnet-sdk-8.0
sudo apt-get purge dotnet-sdk-8.0
```

### CentOS/RHEL/Fedora
```bash
sudo dnf remove dotnet-sdk-8.0
```

### Manual Installation
```bash
sudo rm -rf /usr/share/dotnet
sudo rm -rf ~/.dotnet
```

## After Installation: Run Migrations

Once .NET SDK is installed, you can run migrations:

```bash
# Navigate to your API directory
cd /var/www/ams/api

# Install EF tools (if not already installed)
dotnet tool install --global dotnet-ef

# Run migrations
export ASPNETCORE_ENVIRONMENT=Production
dotnet ef database update \
  --project salini.api.Infrastructure \
  --startup-project salini.api.API
```

## System Requirements

- **.NET 8.0 SDK** requires:
  - Linux x64, ARM64, or ARM32
  - glibc 2.27 or later
  - OpenSSL 1.1 or later

## Quick Reference

```bash
# Install on Ubuntu/Debian
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Install on CentOS/RHEL/Fedora
sudo rpm -Uvh https://packages.microsoft.com/config/centos/8/packages-microsoft-prod.rpm
sudo dnf install -y dotnet-sdk-8.0

# Verify
dotnet --version

# Install EF tools
dotnet tool install --global dotnet-ef
```

