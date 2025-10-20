using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.Company;
using salini.api.Application.Features.Companies.Commands.CreateCompany;
using salini.api.Application.Features.Companies.Commands.DeleteCompany;
using salini.api.Application.Features.Companies.Commands.UpdateCompany;
using salini.api.Application.Features.Companies.Queries.GetCompanies;
using salini.api.Application.Features.Companies.Queries.GetCompanyById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CompaniesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all companies with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<CompanyListDto>>> GetCompanies(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetCompaniesQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get company by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetCompany(string id)
    {
        var query = new GetCompanyByIdQuery { Id = id };
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound();
            
        return Ok(result);
    }

    /// <summary>
    /// Create a new company
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CompanyDto>> CreateCompany([FromBody] CompanyCreateDto createDto)
    {
        var command = new CreateCompanyCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            Status = createDto.Status
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCompany), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing company
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CompanyDto>> UpdateCompany(string id, [FromBody] CompanyUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateCompanyCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            Status = updateDto.Status
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a company
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCompany(string id)
    {
        var command = new DeleteCompanyCommand { Id = id };
        await _mediator.Send(command);
        return NoContent();
    }
}
