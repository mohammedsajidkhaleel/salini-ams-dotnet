using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Services;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    /// <summary>
    /// Get asset summary report
    /// </summary>
    [HttpGet("asset-summary")]
    public async Task<ActionResult<object>> GetAssetSummaryReport()
    {
        var report = await _reportingService.GetAssetSummaryReportAsync();
        return Ok(report);
    }

    /// <summary>
    /// Get employee asset report
    /// </summary>
    [HttpGet("employee-assets")]
    public async Task<ActionResult<object>> GetEmployeeAssetReport([FromQuery] string? departmentId = null, [FromQuery] string? projectId = null)
    {
        var report = await _reportingService.GetEmployeeAssetReportAsync(departmentId, projectId);
        return Ok(report);
    }

    /// <summary>
    /// Get asset utilization report
    /// </summary>
    [HttpGet("asset-utilization")]
    public async Task<ActionResult<object>> GetAssetUtilizationReport()
    {
        var report = await _reportingService.GetAssetUtilizationReportAsync();
        return Ok(report);
    }

    /// <summary>
    /// Get asset maintenance report
    /// </summary>
    [HttpGet("asset-maintenance")]
    public async Task<ActionResult<object>> GetAssetMaintenanceReport()
    {
        var report = await _reportingService.GetAssetMaintenanceReportAsync();
        return Ok(report);
    }

    /// <summary>
    /// Get assets with expiring warranty
    /// </summary>
    [HttpGet("expiring-warranty")]
    public async Task<ActionResult<object>> GetAssetsWithExpiringWarranty([FromQuery] int daysAhead = 30)
    {
        var assets = await _reportingService.GetAssetsExpiringWarrantyAsync(daysAhead);
        return Ok(assets);
    }
}
