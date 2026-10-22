using Affinovas.Domain.Common;

namespace Affinovas.Domain.Entities;

public class PartnerMerchant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal CashbackRate { get; set; }
    public string Logo { get; set; } = "🛍️";
    public string RedirectUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int TotalClicks { get; set; } = 0;
}
