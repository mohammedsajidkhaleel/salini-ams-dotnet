using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs;
using salini.api.Application.DTOs.PurchaseOrder;
using salini.api.Application.Features.PurchaseOrders.Commands.CreatePurchaseOrder;
using salini.api.Application.Features.PurchaseOrders.Commands.DeletePurchaseOrder;
using salini.api.Application.Features.PurchaseOrders.Commands.UpdatePurchaseOrder;
using salini.api.Application.Features.PurchaseOrders.Queries.GetPurchaseOrderById;
using salini.api.Application.Features.PurchaseOrders.Queries.GetPurchaseOrders;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : BaseController
{
    private readonly IMediator _mediator;

    public PurchaseOrdersController(IMediator mediator, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        : base(userManager, context)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all purchase orders with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<PurchaseOrderListDto>>> GetPurchaseOrders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? supplierId = null,
        [FromQuery] string? projectId = null,
        [FromQuery] int? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        // Get user's project filter
        var userProjectIds = await GetProjectFilterAsync();
        
        // If user has project restrictions and no specific projectId is requested, use user's projects
        if (userProjectIds != null && string.IsNullOrEmpty(projectId))
        {
            // For now, we'll use the first project ID if user has multiple projects
            if (userProjectIds.Count > 0)
            {
                projectId = userProjectIds[0];
            }
            else
            {
                // User has no assigned projects, return empty result
                return Ok(new PaginatedResult<PurchaseOrderListDto>
                {
                    Items = new List<PurchaseOrderListDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
        }
        // If user requested a specific projectId, check if they have access to it
        else if (userProjectIds != null && !string.IsNullOrEmpty(projectId) && !userProjectIds.Contains(projectId))
        {
            return Forbid("You don't have access to this project's purchase orders.");
        }

        var query = new GetPurchaseOrdersQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            SupplierId = supplierId,
            ProjectId = projectId,
            Status = status,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific purchase order by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PurchaseOrderDto>> GetPurchaseOrderById(string id)
    {
        var query = new GetPurchaseOrderByIdQuery { Id = id };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create a new purchase order
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PurchaseOrderDto>> CreatePurchaseOrder([FromBody] PurchaseOrderCreateDto createDto)
    {
        var command = new CreatePurchaseOrderCommand
        {
            PoNumber = createDto.PoNumber,
            PoDate = createDto.PoDate,
            ExpectedDeliveryDate = createDto.ExpectedDeliveryDate,
            Status = createDto.Status,
            Notes = createDto.Notes,
            RequestedById = createDto.RequestedById,
            SupplierId = createDto.SupplierId,
            ProjectId = createDto.ProjectId,
            Items = createDto.Items
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetPurchaseOrderById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing purchase order
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<PurchaseOrderDto>> UpdatePurchaseOrder(string id, [FromBody] PurchaseOrderUpdateDto updateDto)
    {
        var command = new UpdatePurchaseOrderCommand
        {
            Id = id,
            PoNumber = updateDto.PoNumber,
            PoDate = updateDto.PoDate,
            ExpectedDeliveryDate = updateDto.ExpectedDeliveryDate,
            ActualDeliveryDate = updateDto.ActualDeliveryDate,
            Status = updateDto.Status,
            Notes = updateDto.Notes,
            RequestedById = updateDto.RequestedById,
            SupplierId = updateDto.SupplierId,
            ProjectId = updateDto.ProjectId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete a purchase order
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePurchaseOrder(string id)
    {
        var command = new DeletePurchaseOrderCommand { Id = id };
        await _mediator.Send(command);
        return NoContent();
    }
}
