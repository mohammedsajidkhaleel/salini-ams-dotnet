using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "Salini AMS API is running!", timestamp = DateTime.UtcNow });
    }

    [HttpGet("auth")]
    [Authorize]
    public IActionResult GetAuth()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        
        return Ok(new 
        { 
            message = "Authenticated endpoint working!", 
            userId,
            userEmail,
            timestamp = DateTime.UtcNow 
        });
    }
}
