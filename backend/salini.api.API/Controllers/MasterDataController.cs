using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Features.MasterData.Commands.BulkCreateMasterData;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Enums;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MasterDataController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public MasterDataController(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    /// <summary>
    /// Bulk create master data
    /// </summary>
    [HttpPost("bulk-create")]
    public async Task<ActionResult<BulkCreateMasterDataResult>> BulkCreateMasterData([FromBody] BulkCreateMasterDataRequest request)
    {
        var command = new BulkCreateMasterDataCommand
        {
            Companies = request.Companies,
            Departments = request.Departments,
            Projects = request.Projects,
            CostCenters = request.CostCenters,
            Nationalities = request.Nationalities,
            EmployeeCategories = request.EmployeeCategories,
            EmployeePositions = request.EmployeePositions,
            ItemCategories = request.ItemCategories,
            Items = request.Items,
            Suppliers = request.Suppliers,
            SimProviders = request.SimProviders,
            SimTypes = request.SimTypes,
            SimCardPlans = request.SimCardPlans
        };

        var result = await _mediator.Send(command);
        
        if (result.Success)
            return Ok(result);
        else
            return BadRequest(result);
    }

    /// <summary>
    /// Get master data statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<MasterDataStatistics>> GetMasterDataStatistics()
    {
        try
        {
            var statistics = new MasterDataStatistics
            {
                TotalCompanies = await _context.Companies.CountAsync(),
                TotalDepartments = await _context.Departments.CountAsync(),
                TotalProjects = await _context.Projects.CountAsync(),
                TotalEmployees = await _context.Employees.CountAsync(e => e.Status == Status.Active),
                TotalAssets = await _context.Assets.CountAsync(),
                TotalSimCards = await _context.SimCards.CountAsync(),
                TotalSoftwareLicenses = await _context.SoftwareLicenses.CountAsync()
            };

            return Ok(statistics);
        }
        catch (Exception)
        {
            // Log the exception
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }

    /// <summary>
    /// Get SIM providers
    /// </summary>
    [HttpGet("sim-providers")]
    public async Task<ActionResult<List<object>>> GetSimProviders()
    {
        var providers = await _context.SimProviders
            .Where(sp => sp.IsActive)
            .Select(sp => new { sp.Id, sp.Name, sp.Description, IsActive = sp.IsActive })
            .ToListAsync();

        return Ok(providers);
    }

    /// <summary>
    /// Get SIM types
    /// </summary>
    [HttpGet("sim-types")]
    public async Task<ActionResult<List<object>>> GetSimTypes()
    {
        var types = await _context.SimTypes
            .Where(st => st.IsActive)
            .Select(st => new { st.Id, st.Name, st.Description, IsActive = st.IsActive })
            .ToListAsync();

        return Ok(types);
    }

    /// <summary>
    /// Get SIM card plans
    /// </summary>
    [HttpGet("sim-card-plans")]
    public async Task<ActionResult<List<object>>> GetSimCardPlans()
    {
        var plans = await _context.SimCardPlans
            .Where(scp => scp.IsActive)
            .Select(scp => new { scp.Id, scp.Name, scp.Description, IsActive = scp.IsActive })
            .ToListAsync();

        return Ok(plans);
    }
}

public class BulkCreateMasterDataRequest
{
    public List<CompanyCreateRequest> Companies { get; set; } = new();
    public List<DepartmentCreateRequest> Departments { get; set; } = new();
    public List<ProjectCreateRequest> Projects { get; set; } = new();
    public List<CostCenterCreateRequest> CostCenters { get; set; } = new();
    public List<NationalityCreateRequest> Nationalities { get; set; } = new();
    public List<EmployeeCategoryCreateRequest> EmployeeCategories { get; set; } = new();
    public List<EmployeePositionCreateRequest> EmployeePositions { get; set; } = new();
    public List<ItemCategoryCreateRequest> ItemCategories { get; set; } = new();
    public List<ItemCreateRequest> Items { get; set; } = new();
    public List<SupplierCreateRequest> Suppliers { get; set; } = new();
    public List<SimProviderCreateRequest> SimProviders { get; set; } = new();
    public List<SimTypeCreateRequest> SimTypes { get; set; } = new();
    public List<SimCardPlanCreateRequest> SimCardPlans { get; set; } = new();
}

public class MasterDataStatistics
{
    public int TotalCompanies { get; set; }
    public int TotalDepartments { get; set; }
    public int TotalProjects { get; set; }
    public int TotalEmployees { get; set; }
    public int TotalAssets { get; set; }
    public int TotalSimCards { get; set; }
    public int TotalSoftwareLicenses { get; set; }
}
