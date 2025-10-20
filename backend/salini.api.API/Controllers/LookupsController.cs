using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Features.Lookups.Queries.GetLookupOptions;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LookupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LookupsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get lookup options for dropdowns
    /// </summary>
    /// <param name="lookupType">Type of lookup: companies, departments, subdepartments, projects, costcenters, nationalities, employeecategories, employeepositions, itemcategories, items, suppliers, simproviders, simtypes, simcardplans</param>
    /// <param name="includeInactive">Include inactive items</param>
    [HttpGet("{lookupType}")]
    public async Task<ActionResult<List<LookupOptionDto>>> GetLookupOptions(
        string lookupType,
        [FromQuery] bool includeInactive = false)
    {
        var query = new GetLookupOptionsQuery
        {
            LookupType = lookupType,
            IncludeInactive = includeInactive
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get all available lookup types
    /// </summary>
    [HttpGet("types")]
    public ActionResult<List<string>> GetLookupTypes()
    {
        var types = new List<string>
        {
            "companies",
            "departments", 
            "subdepartments",
            "projects",
            "costcenters",
            "nationalities",
            "employeecategories",
            "employeepositions",
            "itemcategories",
            "items",
            "suppliers",
            "simproviders",
            "simtypes",
            "simcardplans"
        };

        return Ok(types);
    }
}
