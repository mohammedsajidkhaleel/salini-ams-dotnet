# Salini AMS Gateway

This is a YARP (Yet Another Reverse Proxy) gateway project that serves as a single entry point for both the API and client applications.

## Features

- **Reverse Proxy**: Routes API requests to the backend API service
- **Static File Serving**: Serves the Next.js client application
- **CORS Support**: Handles cross-origin requests
- **Health Checks**: Provides health check endpoints
- **Logging**: Comprehensive logging with Serilog
- **Request Logging**: Logs all incoming requests for monitoring

## Configuration

### Routes

- **API Route**: `/api/**` → Routes to the API service (http://localhost:5000)
- **Client Route**: `/**` → Routes to the client application (http://localhost:3000)

### Ports

- **Gateway**: http://localhost:7000, https://localhost:7001
- **API**: http://localhost:5000
- **Client**: http://localhost:3000

## Running the Gateway

1. Start the API service:
   ```bash
   cd salini.api.API
   dotnet run
   ```

2. Start the client application:
   ```bash
   cd ../../client
   npm run dev
   ```

3. Start the gateway:
   ```bash
   cd salini.api.Gateway
   dotnet run
   ```

4. Access the application through the gateway:
   - Main application: http://localhost:7000
   - API documentation: http://localhost:7000/api/swagger
   - Health check: http://localhost:7000/health

## Environment Configuration

- **Development**: Uses development-specific settings with debug logging
- **Production**: Uses production settings with optimized logging

## Logging

Logs are written to:
- Console (with colored output)
- File: `logs/gateway-{date}.txt`

Log levels:
- **Default**: Information
- **YARP**: Information (Debug in development)
- **Microsoft**: Warning
