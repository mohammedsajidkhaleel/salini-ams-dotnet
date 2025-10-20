using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using salini.api.Application.Common.Behaviors;
using salini.api.Application.Services;
using System.Reflection;

namespace salini.api.Application;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Add MediatR
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        // Add AutoMapper
        services.AddAutoMapper(Assembly.GetExecutingAssembly());

        // Add FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Add MediatR behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));

        // Add application services
        services.AddScoped<IAssetManagementService, AssetManagementService>();
        services.AddScoped<IReportingService, ReportingService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IUserPermissionService, UserPermissionService>();

        return services;
    }
}
