# Salini AMS Gateway Deployment Guide

## Overview

The Salini AMS Gateway is a YARP (Yet Another Reverse Proxy) service that provides a single entry point for both the API and client applications. It routes API requests to the backend service and serves the frontend application.

## Architecture

```
Internet → Gateway (Port 7000/7001) → API (Port 5000/5001) + Client (Port 3000)
```

## Prerequisites

- .NET 8.0 Runtime
- Node.js (for client application)
- Database (PostgreSQL/SQL Server)

## Development Setup

### 1. Start the API Service
```bash
cd salini.api.API
dotnet run
```
The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001

### 2. Start the Client Application
```bash
cd ../../client
npm install
npm run dev
```
The client will be available at:
- http://localhost:3000

### 3. Start the Gateway
```bash
cd salini.api.Gateway
dotnet run
```
The gateway will be available at:
- HTTP: http://localhost:7000
- HTTPS: https://localhost:7001

### 4. Access the Application
- Main Application: http://localhost:7000
- API Documentation: http://localhost:7000/api/swagger
- Health Check: http://localhost:7000/health

## Production Deployment

### 1. Build the Gateway
```bash
dotnet publish salini.api.Gateway -c Release -o ./publish
```

### 2. Configure Production Settings
Update `appsettings.Production.json` with production URLs:
```json
{
  "ReverseProxy": {
    "Clusters": {
      "api-cluster": {
        "Destinations": {
          "api-destination": {
            "Address": "https://your-api-domain.com/"
          }
        }
      },
      "client-cluster": {
        "Destinations": {
          "client-destination": {
            "Address": "https://your-client-domain.com/"
          }
        }
      }
    }
  }
}
```

### 3. Deploy with Docker
Create a `Dockerfile`:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["salini.api.Gateway/salini.api.Gateway.csproj", "salini.api.Gateway/"]
RUN dotnet restore "salini.api.Gateway/salini.api.Gateway.csproj"
COPY . .
WORKDIR "/src/salini.api.Gateway"
RUN dotnet build "salini.api.Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "salini.api.Gateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "salini.api.Gateway.dll"]
```

### 4. Environment Variables
Set the following environment variables:
- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS=http://+:80;https://+:443`

## Configuration

### Routing Rules

1. **API Routes** (`/api/**`):
   - Matches: `/api/{**catch-all}`
   - Forwards to: API service
   - Transforms path to: `/{**catch-all}`

2. **Client Routes** (`/**`):
   - Matches: `/{**catch-all}`
   - Forwards to: Client application

### Health Checks

The gateway provides health check endpoints:
- `/health` - Basic health check
- `/` - Status endpoint

### Logging

Logs are written to:
- Console (colored output)
- File: `logs/gateway-{date}.txt`

Log levels:
- **Development**: Debug
- **Production**: Warning (with YARP Information)

## Monitoring

### Key Metrics to Monitor
- Request latency
- Error rates
- Upstream service health
- Memory and CPU usage

### Log Analysis
Monitor the following log patterns:
- Failed upstream connections
- High latency requests
- Error responses

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if API service is running
   - Verify API service URL in configuration

2. **404 Not Found**
   - Check client application is running
   - Verify client service URL in configuration

3. **CORS Issues**
   - Gateway handles CORS automatically
   - Check if upstream services have CORS configured

### Debug Mode
Enable debug logging by setting:
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug"
    }
  }
}
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Authentication**: The gateway passes through authentication headers
3. **Rate Limiting**: Consider implementing rate limiting
4. **Request Validation**: Validate requests before forwarding

## Performance Optimization

1. **Connection Pooling**: YARP handles connection pooling automatically
2. **Caching**: Consider implementing response caching
3. **Load Balancing**: Configure multiple destinations for high availability
4. **Compression**: Enable response compression
