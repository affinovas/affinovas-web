using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Affinovas.Domain.Entities;
using Affinovas.Domain.Enums;
using Affinovas.Infrastructure.Authentication;

namespace Affinovas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    // In-memory user store for demo/standalone operation, backed by SQL schema when configured
    private static readonly List<User> _users = new()
    {
        new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Email = "admin@affinovas.com",
            PasswordHash = "admin123",
            FirstName = "Affinovas",
            LastName = "Admin",
            Role = UserRole.Admin,
            ReferralCode = "AFF-ADMIN",
            GrainsBalance = 5000000,
            CashbackBalance = 240000.00m,
            IsActive = true
        },
        new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Email = "ramu@affinovas.com",
            PasswordHash = "ramu123",
            FirstName = "Ramu",
            LastName = "AntLeader",
            Role = UserRole.Member,
            ReferralCode = "AFF-RAMU",
            GrainsBalance = 1840,
            CashbackBalance = 450.00m,
            UpiId = "ramu@okhdfcbank",
            DirectAntsCount = 2,
            ActiveBranchDepth = 3,
            IsActive = true
        }
    };

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto request)
    {
        var user = _users.FirstOrDefault(u => 
            u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase) && 
            u.PasswordHash == request.Password);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return BadRequest(new { message = "Your colony account is currently suspended. Contact support." });
        }

        var token = GenerateJwtToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                Role = user.Role.ToString().ToLower(),
                user.ReferralCode,
                user.GrainsBalance,
                user.CashbackBalance,
                user.UpiId,
                user.DirectAntsCount,
                user.ActiveBranchDepth
            }
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterDto request)
    {
        if (_users.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = "An ant with this email is already registered." });
        }

        var refCode = "AFF-" + (request.FirstName?.ToUpper().Replace(" ", "") ?? "ANT") + new Random().Next(100, 999);

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = request.Password,
            FirstName = request.FirstName,
            LastName = request.LastName ?? "",
            Role = UserRole.Member,
            ReferralCode = refCode,
            ReferredBy = request.ReferralCode,
            GrainsBalance = 50, // Welcome gift grains
            CashbackBalance = 0,
            UpiId = request.UpiId,
            DirectAntsCount = 0,
            ActiveBranchDepth = 1,
            IsActive = true
        };

        _users.Add(newUser);

        var token = GenerateJwtToken(newUser);
        return Ok(new
        {
            token,
            user = new
            {
                newUser.Id,
                newUser.Email,
                Name = $"{newUser.FirstName} {newUser.LastName}".Trim(),
                Role = newUser.Role.ToString().ToLower(),
                newUser.ReferralCode,
                newUser.GrainsBalance,
                newUser.CashbackBalance,
                newUser.UpiId,
                newUser.DirectAntsCount,
                newUser.ActiveBranchDepth
            }
        });
    }

    [HttpGet("users")]
    public static List<User> GetInternalUsers() => _users;

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("name", $"{user.FirstName} {user.LastName}".Trim()),
            new Claim("refCode", user.ReferralCode)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(jwtSettings.ExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginDto(string Email, string Password);
public record RegisterDto(string Email, string Password, string FirstName, string? LastName, string? ReferralCode, string? UpiId);
