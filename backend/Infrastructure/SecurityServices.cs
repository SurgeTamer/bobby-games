using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BobbyGames.Application;
using BobbyGames.Core;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace BobbyGames.Infrastructure;

public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<User> hasher = new();
    public string Hash(User user, string password) => hasher.HashPassword(user, password);
    public bool Verify(User user, string password) =>
        hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
}

public sealed class TokenService(IConfiguration configuration) : ITokenService
{
    public string Create(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString().ToLowerInvariant())
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            "BobbyGames", "BobbyGames.Web", claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
