using System.Data;
using Dapper;
using Affinovas.Application.Common.Interfaces;
using Affinovas.Domain.Entities;
using Affinovas.Domain.Enums;

namespace Affinovas.Infrastructure.Data;

public class SqliteDbInitializer
{
    private readonly ISqlConnectionFactory _connectionFactory;
    private readonly IPasswordHasher _passwordHasher;

    public SqliteDbInitializer(ISqlConnectionFactory connectionFactory, IPasswordHasher passwordHasher)
    {
        _connectionFactory = connectionFactory;
        _passwordHasher = passwordHasher;
    }

    public void Initialize()
    {
        using var conn = _connectionFactory.CreateConnection();

        // 1. Create Users table if not exists
        conn.Execute(@"
            CREATE TABLE IF NOT EXISTS Users (
                Id TEXT PRIMARY KEY,
                Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                PhoneNumber TEXT NOT NULL DEFAULT '',
                PasswordHash TEXT NOT NULL,
                FirstName TEXT NOT NULL,
                LastName TEXT NOT NULL,
                Role INTEGER NOT NULL,
                IsActive INTEGER NOT NULL DEFAULT 1,
                ReferralCode TEXT NOT NULL UNIQUE,
                ReferredBy TEXT,
                GrainsBalance INTEGER NOT NULL DEFAULT 0,
                CashbackBalance REAL NOT NULL DEFAULT 0,
                UpiId TEXT,
                DirectAntsCount INTEGER NOT NULL DEFAULT 0,
                ActiveBranchDepth INTEGER NOT NULL DEFAULT 1,
                CreatedAtUtc TEXT NOT NULL,
                UpdatedAtUtc TEXT
            );

            CREATE TABLE IF NOT EXISTS OtpVerifications (
                Id TEXT PRIMARY KEY,
                PhoneNumber TEXT NOT NULL,
                OtpCode TEXT NOT NULL,
                ExpiresAtUtc TEXT NOT NULL,
                IsUsed INTEGER NOT NULL DEFAULT 0,
                CreatedAtUtc TEXT NOT NULL
            );
        ");

        // Ensure PhoneNumber column exists if table was previously created
        try
        {
            conn.Execute("ALTER TABLE Users ADD COLUMN PhoneNumber TEXT NOT NULL DEFAULT '';");
        }
        catch { /* Column already exists */ }

        // Clean legacy mock balances and dummy test data for production readiness
        conn.Execute(@"
            UPDATE Users 
            SET GrainsBalance = 0, CashbackBalance = 0.0, DirectAntsCount = 0, ActiveBranchDepth = 1 
            WHERE Email = 'admin@affinovas.com';
            DELETE FROM Users WHERE Email IN ('ramu@affinovas.com', 'somu@affinovas.com', 'mani@affinovas.com');
        ");

        // 2. Seed Master Admin with BCrypt hashed password if table is empty
        var userCount = conn.ExecuteScalar<int>("SELECT COUNT(1) FROM Users;");
        if (userCount == 0)
        {
            var adminUser = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "admin@affinovas.com",
                PhoneNumber = "+919999999999",
                PasswordHash = _passwordHasher.HashPassword("admin123"),
                FirstName = "Affinovas",
                LastName = "Admin",
                Role = UserRole.Admin,
                ReferralCode = "AFF-ADMIN",
                GrainsBalance = 0,
                CashbackBalance = 0.00m,
                UpiId = "treasury@affinovas",
                DirectAntsCount = 0,
                ActiveBranchDepth = 1,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            InsertUser(conn, adminUser);
        }
    }

    private static void InsertUser(IDbConnection conn, User u)
    {
        conn.Execute(@"
            INSERT INTO Users (
                Id, Email, PasswordHash, FirstName, LastName, Role, IsActive,
                ReferralCode, ReferredBy, GrainsBalance, CashbackBalance, UpiId,
                DirectAntsCount, ActiveBranchDepth, CreatedAtUtc
            ) VALUES (
                @Id, @Email, @PasswordHash, @FirstName, @LastName, @Role, @IsActive,
                @ReferralCode, @ReferredBy, @GrainsBalance, @CashbackBalance, @UpiId,
                @DirectAntsCount, @ActiveBranchDepth, @CreatedAtUtc
            );
        ", new
        {
            Id = u.Id.ToString(),
            u.Email,
            u.PasswordHash,
            u.FirstName,
            u.LastName,
            Role = (int)u.Role,
            IsActive = u.IsActive ? 1 : 0,
            u.ReferralCode,
            u.ReferredBy,
            u.GrainsBalance,
            u.CashbackBalance,
            u.UpiId,
            u.DirectAntsCount,
            u.ActiveBranchDepth,
            CreatedAtUtc = u.CreatedAtUtc.ToString("o")
        });
    }
}
