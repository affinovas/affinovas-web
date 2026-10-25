using System.Data;
using Dapper;
using Affinovas.Application.Common.Interfaces;
using Affinovas.Domain.Entities;
using Affinovas.Domain.Enums;

namespace Affinovas.Infrastructure.Data;

public class UserRepository : IUserRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public UserRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = _connectionFactory.CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync<UserDbModel>(
            "SELECT * FROM Users WHERE Email = @Email COLLATE NOCASE LIMIT 1;",
            new { Email = email.Trim() }
        );

        return row != null ? MapToEntity(row) : null;
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
        using var conn = _connectionFactory.CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync<UserDbModel>(
            "SELECT * FROM Users WHERE PhoneNumber = @Phone LIMIT 1;",
            new { Phone = phone.Trim() }
        );

        return row != null ? MapToEntity(row) : null;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync<UserDbModel>(
            "SELECT * FROM Users WHERE Id = @Id LIMIT 1;",
            new { Id = id.ToString() }
        );

        return row != null ? MapToEntity(row) : null;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.QueryAsync<UserDbModel>("SELECT * FROM Users ORDER BY CreatedAtUtc DESC;");
        return rows.Select(MapToEntity);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        using var conn = _connectionFactory.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM Users WHERE Email = @Email COLLATE NOCASE;",
            new { Email = email.Trim() }
        );
        return count > 0;
    }

    public async Task<bool> PhoneExistsAsync(string phone)
    {
        using var conn = _connectionFactory.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM Users WHERE PhoneNumber = @Phone;",
            new { Phone = phone.Trim() }
        );
        return count > 0;
    }

    public async Task CreateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(@"
            INSERT INTO Users (
                Id, Email, PhoneNumber, PasswordHash, FirstName, LastName, Role, IsActive,
                ReferralCode, ReferredBy, GrainsBalance, CashbackBalance, UpiId,
                DirectAntsCount, ActiveBranchDepth, CreatedAtUtc
            ) VALUES (
                @Id, @Email, @PhoneNumber, @PasswordHash, @FirstName, @LastName, @Role, @IsActive,
                @ReferralCode, @ReferredBy, @GrainsBalance, @CashbackBalance, @UpiId,
                @DirectAntsCount, @ActiveBranchDepth, @CreatedAtUtc
            );
        ", new
        {
            Id = user.Id.ToString(),
            user.Email,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            user.PasswordHash,
            user.FirstName,
            user.LastName,
            Role = (int)user.Role,
            IsActive = user.IsActive ? 1 : 0,
            user.ReferralCode,
            user.ReferredBy,
            user.GrainsBalance,
            user.CashbackBalance,
            user.UpiId,
            user.DirectAntsCount,
            user.ActiveBranchDepth,
            CreatedAtUtc = user.CreatedAtUtc.ToString("o")
        });
    }

    public async Task UpdateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(@"
            UPDATE Users SET
                FirstName = @FirstName,
                LastName = @LastName,
                PasswordHash = @PasswordHash,
                Role = @Role,
                IsActive = @IsActive,
                GrainsBalance = @GrainsBalance,
                CashbackBalance = @CashbackBalance,
                UpiId = @UpiId,
                DirectAntsCount = @DirectAntsCount,
                ActiveBranchDepth = @ActiveBranchDepth,
                UpdatedAtUtc = @UpdatedAtUtc
            WHERE Id = @Id;
        ", new
        {
            Id = user.Id.ToString(),
            user.FirstName,
            user.LastName,
            user.PasswordHash,
            Role = (int)user.Role,
            IsActive = user.IsActive ? 1 : 0,
            user.GrainsBalance,
            user.CashbackBalance,
            user.UpiId,
            user.DirectAntsCount,
            user.ActiveBranchDepth,
            UpdatedAtUtc = DateTime.UtcNow.ToString("o")
        });
    }

    private static User MapToEntity(UserDbModel r) => new()
    {
        Id = Guid.Parse(r.Id),
        Email = r.Email,
        PhoneNumber = r.PhoneNumber ?? string.Empty,
        PasswordHash = r.PasswordHash,
        FirstName = r.FirstName,
        LastName = r.LastName,
        Role = (UserRole)r.Role,
        IsActive = r.IsActive == 1,
        ReferralCode = r.ReferralCode,
        ReferredBy = r.ReferredBy,
        GrainsBalance = r.GrainsBalance,
        CashbackBalance = Convert.ToDecimal(r.CashbackBalance),
        UpiId = r.UpiId,
        DirectAntsCount = r.DirectAntsCount,
        ActiveBranchDepth = r.ActiveBranchDepth,
        CreatedAtUtc = DateTime.TryParse(r.CreatedAtUtc, out var dt) ? dt : DateTime.UtcNow
    };

    private class UserDbModel
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int Role { get; set; }
        public int IsActive { get; set; }
        public string ReferralCode { get; set; } = string.Empty;
        public string? ReferredBy { get; set; }
        public long GrainsBalance { get; set; }
        public double CashbackBalance { get; set; }
        public string? UpiId { get; set; }
        public int DirectAntsCount { get; set; }
        public int ActiveBranchDepth { get; set; }
        public string CreatedAtUtc { get; set; } = string.Empty;
        public string? UpdatedAtUtc { get; set; }
    }
}
