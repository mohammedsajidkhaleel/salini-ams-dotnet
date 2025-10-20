# Database Setup Script for Salini AMS Backend
# This script helps set up the PostgreSQL database and run migrations

param(
    [string]$ConnectionString = "Host=localhost;Port=5432;Database=salini_ams_db;Username=postgres;Password=your_password",
    [switch]$SkipDatabaseCreation = $false
)

Write-Host "=== Salini AMS Database Setup ===" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $env:ConnectionStrings__DefaultConnection = $ConnectionString
    dotnet ef database update --project salini.api.Infrastructure --startup-project salini.api.API --verbose
    Write-Host "Database migration completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error during database migration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is installed and running" -ForegroundColor Yellow
    Write-Host "2. The connection string is correct" -ForegroundColor Yellow
    Write-Host "3. The database user has sufficient permissions" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Database Setup Complete ===" -ForegroundColor Green
Write-Host "You can now run the API with: dotnet run --project salini.api.API" -ForegroundColor Cyan
Write-Host "API will be available at: https://localhost:7001" -ForegroundColor Cyan
Write-Host "Swagger UI will be available at: https://localhost:7001" -ForegroundColor Cyan
