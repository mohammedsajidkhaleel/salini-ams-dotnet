using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.Services;
using salini.api.Domain.Entities;
using System.Security.Cryptography;

namespace salini.api.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IApplicationDbContext _context;

    public TokenService(IApplicationDbContext context)
    {
        _context = context;
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task<RefreshToken> SaveRefreshTokenAsync(string userId, string token, DateTime expiresAt)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid().ToString(),
            Token = token,
            UserId = userId,
            ExpiresAt = expiresAt,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken;
    }

    public async Task<ApplicationUser?> ValidateRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken == null)
            return null;

        // Check if token is revoked
        if (refreshToken.IsRevoked)
            return null;

        // Check if token is expired
        if (refreshToken.ExpiresAt < DateTime.UtcNow)
            return null;

        // Check if user is still active
        if (!refreshToken.User.IsActive)
            return null;

        return refreshToken.User;
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken != null)
        {
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeUserTokensAsync(string userId)
    {
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        if (tokens.Count > 0)
        {
            await _context.SaveChangesAsync();
        }
    }
}

