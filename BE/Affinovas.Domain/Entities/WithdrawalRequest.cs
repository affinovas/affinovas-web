using Affinovas.Domain.Common;

namespace Affinovas.Domain.Entities;

public enum WithdrawalStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public class WithdrawalRequest : BaseEntity
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string UpiId { get; set; } = string.Empty;
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public string? UtrNumber { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
