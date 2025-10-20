using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;

namespace salini.api.Application.Features.MasterData.Commands.BulkCreateMasterData;

public record BulkCreateMasterDataCommand : ICommand<BulkCreateMasterDataResult>
{
    public List<CompanyCreateRequest> Companies { get; init; } = new();
    public List<DepartmentCreateRequest> Departments { get; init; } = new();
    public List<ProjectCreateRequest> Projects { get; init; } = new();
    public List<CostCenterCreateRequest> CostCenters { get; init; } = new();
    public List<NationalityCreateRequest> Nationalities { get; init; } = new();
    public List<EmployeeCategoryCreateRequest> EmployeeCategories { get; init; } = new();
    public List<EmployeePositionCreateRequest> EmployeePositions { get; init; } = new();
    public List<ItemCategoryCreateRequest> ItemCategories { get; init; } = new();
    public List<ItemCreateRequest> Items { get; init; } = new();
    public List<SupplierCreateRequest> Suppliers { get; init; } = new();
    public List<SimProviderCreateRequest> SimProviders { get; init; } = new();
    public List<SimTypeCreateRequest> SimTypes { get; init; } = new();
    public List<SimCardPlanCreateRequest> SimCardPlans { get; init; } = new();
}

public class BulkCreateMasterDataCommandHandler : IRequestHandler<BulkCreateMasterDataCommand, BulkCreateMasterDataResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public BulkCreateMasterDataCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<BulkCreateMasterDataResult> Handle(BulkCreateMasterDataCommand request, CancellationToken cancellationToken)
    {
        var result = new BulkCreateMasterDataResult();
        var now = DateTime.UtcNow;
        var userId = _currentUserService.UserId;

        try
        {
            // Create Companies
            if (request.Companies.Any())
            {
                var companies = request.Companies.Select(c => new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = c.Name,
                    Description = c.Description,
                    Status = c.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.Companies.AddRange(companies);
                result.CompaniesCreated = companies.Count;
            }

            // Create Departments
            if (request.Departments.Any())
            {
                var departments = request.Departments.Select(d => new Department
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = d.Name,
                    Description = d.Description,
                    Status = d.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.Departments.AddRange(departments);
                result.DepartmentsCreated = departments.Count;
            }

            // Create Cost Centers
            if (request.CostCenters.Any())
            {
                var costCenters = request.CostCenters.Select(cc => new CostCenter
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = cc.Name,
                    Description = cc.Description,
                    Status = cc.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.CostCenters.AddRange(costCenters);
                result.CostCentersCreated = costCenters.Count;
            }

            // Create Nationalities
            if (request.Nationalities.Any())
            {
                var nationalities = request.Nationalities.Select(n => new Nationality
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = n.Name,
                    Description = n.Description,
                    Status = n.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.Nationalities.AddRange(nationalities);
                result.NationalitiesCreated = nationalities.Count;
            }

            // Create Employee Categories
            if (request.EmployeeCategories.Any())
            {
                var employeeCategories = request.EmployeeCategories.Select(ec => new EmployeeCategory
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = ec.Name,
                    Description = ec.Description,
                    Status = ec.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.EmployeeCategories.AddRange(employeeCategories);
                result.EmployeeCategoriesCreated = employeeCategories.Count;
            }

            // Create Employee Positions
            if (request.EmployeePositions.Any())
            {
                var employeePositions = request.EmployeePositions.Select(ep => new EmployeePosition
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = ep.Name,
                    Description = ep.Description,
                    Status = ep.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.EmployeePositions.AddRange(employeePositions);
                result.EmployeePositionsCreated = employeePositions.Count;
            }

            // Create Item Categories
            if (request.ItemCategories.Any())
            {
                var itemCategories = request.ItemCategories.Select(ic => new ItemCategory
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = ic.Name,
                    Description = ic.Description,
                    Status = ic.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.ItemCategories.AddRange(itemCategories);
                result.ItemCategoriesCreated = itemCategories.Count;
            }

            // Create Suppliers
            if (request.Suppliers.Any())
            {
                var suppliers = request.Suppliers.Select(s => new Supplier
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = s.Name,
                    ContactPerson = s.ContactPerson,
                    Email = s.Email,
                    Phone = s.Phone,
                    Address = s.Address,
                    Status = s.Status,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.Suppliers.AddRange(suppliers);
                result.SuppliersCreated = suppliers.Count;
            }

            // Create SIM Providers
            if (request.SimProviders.Any())
            {
                var simProviders = request.SimProviders.Select(sp => new SimProvider
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = sp.Name,
                    Description = sp.Description,
                    ContactInfo = sp.ContactInfo,
                    IsActive = sp.IsActive,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.SimProviders.AddRange(simProviders);
                result.SimProvidersCreated = simProviders.Count;
            }

            // Create SIM Types
            if (request.SimTypes.Any())
            {
                var simTypes = request.SimTypes.Select(st => new SimType
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = st.Name,
                    Description = st.Description,
                    IsActive = st.IsActive,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList();

                _context.SimTypes.AddRange(simTypes);
                result.SimTypesCreated = simTypes.Count;
            }

            await _context.SaveChangesAsync(cancellationToken);
            result.Success = true;
            result.Message = "Master data created successfully";
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Message = $"Error creating master data: {ex.Message}";
        }

        return result;
    }
}

// Request DTOs
public class CompanyCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class DepartmentCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class ProjectCreateRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
    public string CompanyId { get; set; } = string.Empty;
    public string CostCenterId { get; set; } = string.Empty;
    public string NationalityId { get; set; } = string.Empty;
}

public class CostCenterCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class NationalityCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class EmployeeCategoryCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class EmployeePositionCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class ItemCategoryCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class ItemCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ItemCategoryId { get; set; } = string.Empty;
    public Status Status { get; set; } = Status.Active;
}

public class SupplierCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public Status Status { get; set; } = Status.Active;
}

public class SimProviderCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SimTypeCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SimCardPlanCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DataLimit { get; set; }
    public decimal MonthlyFee { get; set; }
    public string ProviderId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

// Result DTO
public class BulkCreateMasterDataResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int CompaniesCreated { get; set; }
    public int DepartmentsCreated { get; set; }
    public int ProjectsCreated { get; set; }
    public int CostCentersCreated { get; set; }
    public int NationalitiesCreated { get; set; }
    public int EmployeeCategoriesCreated { get; set; }
    public int EmployeePositionsCreated { get; set; }
    public int ItemCategoriesCreated { get; set; }
    public int ItemsCreated { get; set; }
    public int SuppliersCreated { get; set; }
    public int SimProvidersCreated { get; set; }
    public int SimTypesCreated { get; set; }
    public int SimCardPlansCreated { get; set; }
}
