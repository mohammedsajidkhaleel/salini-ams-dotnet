using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using salini.api.Application.Common.Interfaces;
using salini.api.Infrastructure.Data;
using salini.api.Infrastructure.Repositories;
using salini.api.Infrastructure.Services;

namespace salini.api.Infrastructure;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Database Context
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Register DbContext interface
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register individual repositories
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IAssetRepository, AssetRepository>();
        services.AddScoped<ISimCardRepository, SimCardRepository>();
        services.AddScoped<ISoftwareLicenseRepository, SoftwareLicenseRepository>();

        // Register services
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
