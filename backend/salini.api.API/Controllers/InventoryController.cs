using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Inventory;
using salini.api.Application.Features.Inventory.Queries.ExportInventory;
using salini.api.Application.Services;
using salini.api.Domain.Entities;

namespace salini.api.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : BaseController
    {
        private readonly IInventoryService _inventoryService;
        private readonly IMediator _mediator;

        public InventoryController(IInventoryService inventoryService, IMediator mediator, UserManager<ApplicationUser> userManager, IApplicationDbContext context)
            : base(userManager, context)
        {
            _inventoryService = inventoryService;
            _mediator = mediator;
        }

        /// <summary>
        /// Get inventory summary with calculated available quantities
        /// </summary>
        /// <param name="projectIds">Comma-separated list of project IDs to filter by</param>
        /// <returns>List of inventory items with purchased, allocated, and available counts</returns>
        [HttpGet("Summary")]
        public async Task<ActionResult<List<InventoryDto>>> GetInventorySummary()
        {
            try
            {
                // Get user's project filter - this automatically handles project-based filtering
                var userProjectIds = await GetProjectFilterAsync();
                
                var inventoryItems = await _inventoryService.GetInventorySummaryAsync(userProjectIds);
                return Ok(inventoryItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while calculating inventory", error = ex.Message });
            }
        }

        /// <summary>
        /// Get inventory summary with pre-calculated statistics
        /// </summary>
        /// <returns>Inventory summary with statistics and detailed items</returns>
        [HttpGet("SummaryWithStats")]
        public async Task<ActionResult<InventorySummaryDto>> GetInventorySummaryWithStats()
        {
            try
            {
                Console.WriteLine("🔍 InventoryController: GetInventorySummaryWithStats called");
                
                // Get user's project filter - this automatically handles project-based filtering
                var userProjectIds = await GetProjectFilterAsync();
                Console.WriteLine($"🔍 User project IDs: {string.Join(", ", userProjectIds ?? new List<string>())}");
                
                var inventorySummary = await _inventoryService.GetInventorySummaryWithStatsAsync(userProjectIds);
                Console.WriteLine($"🔍 Inventory summary calculated: {inventorySummary?.TotalItems} items, {inventorySummary?.TotalCategories} categories");
                
                return Ok(inventorySummary);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetInventorySummaryWithStats: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while calculating inventory summary", error = ex.Message });
            }
        }

        /// <summary>
        /// Validate inventory calculations for testing purposes
        /// </summary>
        /// <returns>Validation results for inventory calculations</returns>
        [HttpGet("Validate")]
        public async Task<ActionResult<Dictionary<string, object>>> ValidateInventoryCalculations()
        {
            try
            {
                var userProjectIds = await GetProjectFilterAsync();
                var validation = await _inventoryService.ValidateInventoryCalculationsAsync(userProjectIds);
                return Ok(validation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while validating inventory calculations", error = ex.Message });
            }
        }

        /// <summary>
        /// Export inventory to CSV
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportInventory()
        {
            try
            {
                // Get user's project filter - this automatically handles project-based filtering
                var userProjectIds = await GetProjectFilterAsync();
                
                var query = new ExportInventoryQuery
                {
                    ProjectIds = userProjectIds
                };

                var csvBytes = await _mediator.Send(query);
                var fileName = $"inventory-{DateTime.UtcNow:yyyy-MM-dd}.csv";
                
                return File(csvBytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while exporting inventory", error = ex.Message });
            }
        }
    }
}
