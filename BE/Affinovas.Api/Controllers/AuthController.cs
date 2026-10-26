using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Affinovas.Application.Common.Interfaces;
using Affinovas.Domain.Entities;
using Affinovas.Domain.Enums;
using Affinovas.Infrastructure.Authentication;

namespace Affinovas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(
        IConfiguration configuration,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher)
    {
        _configuration = configuration;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email/Phone and password are required." });
        }

        var input = request.Email.Trim();
        var digitsOnly = new string(input.Where(char.IsDigit).ToArray());
        if (digitsOnly.Length > 10 && digitsOnly.StartsWith("91"))
        {
            digitsOnly = digitsOnly.Substring(2);
        }

        User? user = null;
        if (digitsOnly.Length == 10)
        {
            user = await _userRepository.GetByPhoneAsync(digitsOnly);
        }

        if (user == null)
        {
            user = await _userRepository.GetByEmailAsync(input);
        }

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email, phone number, or password." });
        }

        // Verify password using BCrypt
        var isValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isValid)
        {
            return Unauthorized(new { message = "Invalid email, phone number, or password." });
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
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            return BadRequest(new { message = "An ant with this email is already registered." });
        }

        var cleanName = (request.FirstName ?? "Ant").Trim();
        var safePrefix = new string(cleanName.ToUpper().Where(char.IsLetter).Take(5).ToArray());
        if (string.IsNullOrEmpty(safePrefix)) safePrefix = "ANT";
        var refCode = $"AFF-{safePrefix}{Random.Shared.Next(100, 999)}";

        // Securely hash password with BCrypt
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim(),
            PasswordHash = passwordHash,
            FirstName = cleanName,
            LastName = request.LastName?.Trim() ?? string.Empty,
            Role = UserRole.Member,
            ReferralCode = refCode,
            ReferredBy = request.ReferralCode,
            GrainsBalance = 50, // Welcome gift grains
            CashbackBalance = 0,
            UpiId = request.UpiId ?? $"{cleanName.ToLower()}@upi",
            DirectAntsCount = 0,
            ActiveBranchDepth = 1,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(newUser);

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

    // Static in-memory OTP cache for instantaneous high-speed verification
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Code, DateTime ExpiresAt)> OtpCache = new();

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new { message = "Phone number is required." });
        }

        // Normalize Indian phone numbers: remove spaces, dashes, +91
        var digitsOnly = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());
        if (digitsOnly.Length > 10 && digitsOnly.StartsWith("91"))
        {
            digitsOnly = digitsOnly.Substring(2);
        }
        if (digitsOnly.Length != 10)
        {
            return BadRequest(new { message = "Please enter a valid 10-digit mobile number." });
        }

        // Generate 6-digit OTP
        var otp = Random.Shared.Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(10);
        OtpCache[digitsOnly] = (otp, expiresAt);

        // Check if user already exists
        var existingUser = await _userRepository.GetByPhoneAsync(digitsOnly);
        var isNewUser = existingUser == null;

        // In development / demo environment, return OTP in response so users can sign in immediately
        // In production, plug Fast2SMS / Twilio / MSG91 API here
        return Ok(new
        {
            message = $"OTP sent successfully to +91 {digitsOnly}.",
            phoneNumber = digitsOnly,
            isNewUser,
            devOtp = otp // Dev verification pass
        });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
        {
            return BadRequest(new { message = "Phone number and OTP code are required." });
        }

        var digitsOnly = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());
        if (digitsOnly.Length > 10 && digitsOnly.StartsWith("91"))
        {
            digitsOnly = digitsOnly.Substring(2);
        }

        if (!OtpCache.TryGetValue(digitsOnly, out var cachedOtp) || cachedOtp.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired OTP. Please request a new code." });
        }

        if (cachedOtp.Code != request.OtpCode.Trim())
        {
            return BadRequest(new { message = "Incorrect OTP code. Please check and try again." });
        }

        // OTP verified successfully; consume it
        OtpCache.TryRemove(digitsOnly, out _);

        // Find or create user
        var user = await _userRepository.GetByPhoneAsync(digitsOnly);
        if (user == null)
        {
            // Register new ant member with real initial empty state
            var cleanName = (request.AntName ?? "Ant Member").Trim();
            var safePrefix = new string(cleanName.ToUpper().Where(char.IsLetter).Take(4).ToArray());
            if (string.IsNullOrEmpty(safePrefix)) safePrefix = "ANT";
            var refCode = $"AFF-{safePrefix}{Random.Shared.Next(100, 999)}";

            user = new User
            {
                Id = Guid.NewGuid(),
                PhoneNumber = digitsOnly,
                Email = $"{digitsOnly}@affinovas.online",
                PasswordHash = _passwordHasher.HashPassword(string.IsNullOrWhiteSpace(request.Password) ? Guid.NewGuid().ToString("N") : request.Password.Trim()),
                FirstName = cleanName,
                LastName = string.Empty,
                Role = UserRole.Member,
                IsActive = true,
                ReferralCode = refCode,
                ReferredBy = string.IsNullOrWhiteSpace(request.ReferralCode) ? null : request.ReferralCode.Trim().ToUpper(),
                GrainsBalance = 0, // Real authentic 0 initial balance
                CashbackBalance = 0m,
                DirectAntsCount = 0,
                ActiveBranchDepth = 1,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
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
                user.PhoneNumber,
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

    [HttpGet("users")]
    public async Task<IActionResult> GetInternalUsers()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users.Select(u => new
        {
            u.Id,
            u.Email,
            Name = $"{u.FirstName} {u.LastName}".Trim(),
            Role = u.Role.ToString().ToLower(),
            u.ReferralCode,
            u.GrainsBalance,
            u.CashbackBalance,
            u.UpiId,
            u.DirectAntsCount,
            u.ActiveBranchDepth,
            u.IsActive,
            u.CreatedAtUtc
        }));
    }

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
public record SendOtpDto(string PhoneNumber);
public record VerifyOtpDto(string PhoneNumber, string OtpCode, string? AntName, string? ReferralCode, string? Password);

