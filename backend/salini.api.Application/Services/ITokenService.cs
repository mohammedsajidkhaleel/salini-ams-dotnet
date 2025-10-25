using salini.api.Domain.Entities;

namespace salini.api.Application.Services;

public interface ITokenService
{
    /// <summary>
    /// Generate secure random refresh token
    /// </summary>
    string GenerateRefreshToken();
    
    /// <summary>
    /// Save refresh token to database
    /// </summary>
    Task<RefreshToken> SaveRefreshTokenAsync(string userId, string token, DateTime expiresAt);
    
    /// <summary>
    /// Validate refresh token and return associated user
    /// </summary>
    Task<ApplicationUser?> ValidateRefreshTokenAsync(string token);
    
    /// <summary>
    /// Revoke a specific refresh token
    /// </summary>
    Task RevokeRefreshTokenAsync(string token);
    
    /// <summary>
    /// Revoke all refresh tokens for a user
    /// </summary>
    Task RevokeUserTokensAsync(string userId);
}

