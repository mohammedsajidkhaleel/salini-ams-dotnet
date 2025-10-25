# PowerShell script to start all services for the Salini AMS Gateway setup

Write-Host "Starting Salini AMS Gateway Services..." -ForegroundColor Green

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$WorkingDirectory,
        [string]$Command
    )
    
    Write-Host "Starting $ServiceName..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; $Command"
    Start-Sleep -Seconds 2
}

# Start API service
Start-Service -ServiceName "API Service" -WorkingDirectory "salini.api.API" -Command "dotnet run"

# Start Client service (assuming npm is available)
Write-Host "Starting Client Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '../../client'; npm run dev"
Start-Sleep -Seconds 3

# Start Gateway service
Start-Service -ServiceName "Gateway Service" -WorkingDirectory "salini.api.Gateway" -Command "dotnet run"

Write-Host "All services started!" -ForegroundColor Green
Write-Host "Gateway: http://localhost:7000" -ForegroundColor Cyan
Write-Host "API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Client: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:7000/api/swagger" -ForegroundColor Cyan
