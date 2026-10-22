using Affinovas.Domain.Common;
using Affinovas.Domain.Enums;

namespace Affinovas.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;

    // Colony & Wallet Properties
    public string ReferralCode { get; set; } = string.Empty;
    public string? ReferredBy { get; set; }
    public long GrainsBalance { get; set; } = 0;
    public decimal CashbackBalance { get; set; } = 0;
    public string? UpiId { get; set; }
    public int DirectAntsCount { get; set; } = 0;
    public int ActiveBranchDepth { get; set; } = 1;
}
