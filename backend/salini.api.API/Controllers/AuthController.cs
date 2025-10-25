using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using salini.api.Application.Services;
using salini.api.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace salini.api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IUserPermissionService _userPermissionService;
    private readonly ITokenService _tokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        IUserPermissionService userPermissionService,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _logger = logger;
        _userPermissionService = userPermissionService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Generate access token
            var accessToken = await GenerateJwtToken(user);
            
            // Generate and save refresh token
            var refreshToken = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(
                int.Parse(_configuration.GetSection("JwtSettings")["RefreshTokenExpiryDays"]!));
            await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken, refreshTokenExpiry);
            
            // Set refresh token as HttpOnly cookie
            SetRefreshTokenCookie(refreshToken, refreshTokenExpiry);
            
            // Get user permissions using the UserPermissionService
            _logger.LogInformation("Getting permissions for user {UserId}", user.Id);
            List<string> permissions;
            try
            {
                permissions = await _userPermissionService.GetUserPermissionsAsync(user.Id);
                _logger.LogInformation("Retrieved {PermissionCount} permissions for user {UserId}", permissions.Count, user.Id);
            }
            catch (Exception permEx)
            {
                _logger.LogError(permEx, "Error getting permissions for user {UserId}", user.Id);
                // Fallback to empty permissions list if there's an error
                permissions = new List<string>();
            }
            
            // Get user's assigned project IDs from UserProjects table
            _logger.LogInformation("Getting project assignments for user {UserId}", user.Id);
            List<string> projectIds;
            try
            {
                projectIds = await _userManager.Users
                    .Where(u => u.Id == user.Id)
                    .SelectMany(u => u.UserProjects)
                    .Select(up => up.ProjectId)
                    .ToListAsync();
                _logger.LogInformation("Retrieved {ProjectCount} project assignments for user {UserId}", projectIds.Count, user.Id);
            }
            catch (Exception projEx)
            {
                _logger.LogError(projEx, "Error getting project assignments for user {UserId}", user.Id);
                // Fallback to empty project list if there's an error
                projectIds = new List<string>();
            }
            
            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return Ok(new
            {
                token = accessToken,
                user = new
                {
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    fullName = $"{user.FirstName} {user.LastName}",
                    role = user.Role.ToString(),
                    isActive = user.IsActive,
                    permissions = permissions,
                    projectIds = projectIds,
                    lastLoginAt = user.LastLogin?.ToString("O")
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Department = request.Department,
                Role = request.Role,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Registration failed", errors = result.Errors });
            }

            _logger.LogInformation("User {Email} registered successfully", user.Email);

            return Ok(new { message = "User registered successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for user {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            // Get refresh token from cookie
            var refreshToken = Request.Cookies["refreshToken"];
            
            if (!string.IsNullOrEmpty(refreshToken))
            {
                // Revoke the refresh token in database
                await _tokenService.RevokeRefreshTokenAsync(refreshToken);
            }
            
            // Clear refresh token cookie
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            });
            
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "An error occurred during logout" });
        }
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "User not found or inactive" });
            }

            // Get user permissions
            List<string> permissions;
            try
            {
                permissions = await _userPermissionService.GetUserPermissionsAsync(user.Id);
            }
            catch (Exception permEx)
            {
                _logger.LogError(permEx, "Error getting permissions for user {UserId}", user.Id);
                permissions = new List<string>();
            }

            // Get user's assigned project IDs
            List<string> projectIds;
            try
            {
                projectIds = await _userManager.Users
                    .Where(u => u.Id == user.Id)
                    .SelectMany(u => u.UserProjects)
                    .Select(up => up.ProjectId)
                    .ToListAsync();
            }
            catch (Exception projEx)
            {
                _logger.LogError(projEx, "Error getting project assignments for user {UserId}", user.Id);
                projectIds = new List<string>();
            }

            return Ok(new
            {
                id = user.Id,
                userName = user.UserName,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = $"{user.FirstName} {user.LastName}",
                role = user.Role.ToString(),
                isActive = user.IsActive,
                permissions = permissions,
                projectIds = projectIds,
                lastLoginAt = user.LastLogin?.ToString("O")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "An error occurred while getting user data" });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        try
        {
            // Get refresh token from HttpOnly cookie
            var refreshToken = Request.Cookies["refreshToken"];
            
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token not found" });
            }

            // Validate refresh token and get user
            var user = await _tokenService.ValidateRefreshTokenAsync(refreshToken);
            
            if (user == null)
            {
                // Clear invalid cookie
                Response.Cookies.Delete("refreshToken");
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            // Generate new access token
            var newAccessToken = await GenerateJwtToken(user);
            
            // Generate new refresh token (sliding expiration)
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(
                int.Parse(_configuration.GetSection("JwtSettings")["RefreshTokenExpiryDays"]!));
            
            // Save new refresh token
            await _tokenService.SaveRefreshTokenAsync(user.Id, newRefreshToken, refreshTokenExpiry);
            
            // Revoke old refresh token
            await _tokenService.RevokeRefreshTokenAsync(refreshToken);
            
            // Set new refresh token cookie
            SetRefreshTokenCookie(newRefreshToken, refreshTokenExpiry);
            
            _logger.LogInformation("Token refreshed successfully for user {UserId}", user.Id);

            return Ok(new
            {
                token = newAccessToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "An error occurred during token refresh" });
        }
    }

    /// <summary>
    /// Set refresh token as HttpOnly cookie
    /// </summary>
    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Use HTTPS
            SameSite = SameSiteMode.None, // Allow cross-site for CORS
            Expires = expiresAt,
            Path = "/",
            IsEssential = true
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        // Add user permissions as claims
        var userPermissions = await _userManager.GetClaimsAsync(user);
        claims.AddRange(userPermissions);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public Domain.Enums.UserRole Role { get; set; } = Domain.Enums.UserRole.User;
}
