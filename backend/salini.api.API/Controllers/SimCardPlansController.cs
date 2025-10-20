using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.SimCardPlan;
using salini.api.Application.Features.SimCardPlans.Commands.CreateSimCardPlan;
using salini.api.Application.Features.SimCardPlans.Commands.DeleteSimCardPlan;
using salini.api.Application.Features.SimCardPlans.Commands.UpdateSimCardPlan;
using salini.api.Application.Features.SimCardPlans.Queries.GetSimCardPlans;
using salini.api.Application.Features.SimCardPlans.Queries.GetSimCardPlanById;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimCardPlansController : ControllerBase
{
    private readonly IMediator _mediator;

    public SimCardPlansController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<SimCardPlanListDto>>> GetSimCardPlans(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? providerId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        var query = new GetSimCardPlansQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive,
            ProviderId = providerId,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SimCardPlanDto>> GetSimCardPlan(string id)
    {
        var query = new GetSimCardPlanByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SimCardPlanDto>> CreateSimCardPlan([FromBody] SimCardPlanCreateDto createDto)
    {
        var command = new CreateSimCardPlanCommand
        {
            Name = createDto.Name,
            Description = createDto.Description,
            DataLimit = createDto.DataLimit,
            MonthlyFee = createDto.MonthlyFee,
            IsActive = createDto.IsActive,
            ProviderId = createDto.ProviderId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetSimCardPlan), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SimCardPlanDto>> UpdateSimCardPlan(string id, [FromBody] SimCardPlanUpdateDto updateDto)
    {
        if (id != updateDto.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateSimCardPlanCommand
        {
            Id = updateDto.Id,
            Name = updateDto.Name,
            Description = updateDto.Description,
            DataLimit = updateDto.DataLimit,
            MonthlyFee = updateDto.MonthlyFee,
            IsActive = updateDto.IsActive,
            ProviderId = updateDto.ProviderId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSimCardPlan(string id)
    {
        var command = new DeleteSimCardPlanCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
