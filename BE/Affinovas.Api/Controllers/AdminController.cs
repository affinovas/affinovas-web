using Microsoft.AspNetCore.Mvc;
using Affinovas.Application.Common.Interfaces;
using Affinovas.Domain.Entities;
using Affinovas.Domain.Enums;

namespace Affinovas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private static readonly ColonySettings _settings = new();

    private static readonly List<PartnerMerchant> _merchants = new()
    {
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "Flipkart", Category = "Electronics & Fashion", CashbackRate = 8.5m, Logo = "🛒", RedirectUrl = "https://flipkart.com", IsActive = true, TotalClicks = 420 },
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "Amazon", Category = "All Categories", CashbackRate = 7.0m, Logo = "📦", RedirectUrl = "https://amazon.in", IsActive = true, TotalClicks = 612 },
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "Myntra", Category = "Fashion & Lifestyle", CashbackRate = 10.0m, Logo = "👗", RedirectUrl = "https://myntra.com", IsActive = true, TotalClicks = 285 },
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "Swiggy & Instamart", Category = "Food & Grocery", CashbackRate = 5.0m, Logo = "🍔", RedirectUrl = "https://swiggy.com", IsActive = true, TotalClicks = 530 },
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "MakeMyTrip", Category = "Flights & Hotels", CashbackRate = 12.0m, Logo = "✈️", RedirectUrl = "https://makemytrip.com", IsActive = true, TotalClicks = 142 },
        new PartnerMerchant { Id = Guid.NewGuid(), Name = "Ajio", Category = "Trends & Luxury", CashbackRate = 9.0m, Logo = "✨", RedirectUrl = "https://ajio.com", IsActive = true, TotalClicks = 190 }
    };

    public AdminController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var users = (await _userRepository.GetAllAsync()).ToList();
        var withdrawals = UserController.GetInternalWithdrawals();

        var pendingWithdrawals = withdrawals.Where(w => w.Status == WithdrawalStatus.Pending).ToList();
        var approvedWithdrawals = withdrawals.Where(w => w.Status == WithdrawalStatus.Approved).ToList();

        var realGrains = users.Sum(u => u.GrainsBalance);
        var realCashbackDisbursed = approvedWithdrawals.Sum(w => w.Amount);
        var realCashbackHolding = users.Sum(u => u.CashbackBalance);

        return Ok(new
        {
            kpis = new
            {
                totalAnts = users.Count,
                circulatingGrains = realGrains,
                vaultReserveInr = realCashbackHolding,
                cashbackDisbursedInr = realCashbackDisbursed,
                pendingPayoutCount = pendingWithdrawals.Count,
                pendingPayoutAmount = pendingWithdrawals.Sum(w => w.Amount),
                activeMerchants = _merchants.Count(m => m.IsActive)
            },
            systemHealth = "Operational",
            colonySettings = _settings
        });
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetMembers([FromQuery] string? search)
    {
        var users = await _userRepository.GetAllAsync();
        var query = users.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => 
                u.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                u.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                u.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                u.ReferralCode.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(query.Select(u => new
        {
            u.Id,
            Name = $"{u.FirstName} {u.LastName}".Trim(),
            u.Email,
            Role = u.Role.ToString(),
            u.ReferralCode,
            u.ReferredBy,
            u.GrainsBalance,
            u.CashbackBalance,
            u.UpiId,
            u.DirectAntsCount,
            u.ActiveBranchDepth,
            u.IsActive,
            CreatedAt = u.CreatedAtUtc
        }));
    }

    [HttpPost("members/{id}/toggle-status")]
    public async Task<IActionResult> ToggleMemberStatus(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound(new { message = "Member not found." });

        user.IsActive = !user.IsActive;
        await _userRepository.UpdateAsync(user);

        return Ok(new
        {
            success = true,
            isActive = user.IsActive,
            message = $"Ant {user.FirstName} is now {(user.IsActive ? "Active" : "Suspended")}."
        });
    }

    [HttpGet("withdrawals")]
    public IActionResult GetWithdrawals()
    {
        var withdrawals = UserController.GetInternalWithdrawals();
        return Ok(withdrawals);
    }

    [HttpPost("withdrawals/{id}/process")]
    public IActionResult ProcessWithdrawal(Guid id, [FromBody] ProcessWithdrawalDto request)
    {
        var withdrawal = UserController.GetInternalWithdrawals().FirstOrDefault(w => w.Id == id);
        if (withdrawal == null) return NotFound(new { message = "Withdrawal request not found." });

        if (request.Approved)
        {
            withdrawal.Status = WithdrawalStatus.Approved;
            withdrawal.UtrNumber = request.UtrNumber ?? "UTR-" + new Random().Next(10000000, 99999999);
            withdrawal.ProcessedAt = DateTime.UtcNow;
            withdrawal.AdminNote = request.Note ?? "Approved and dispatched via banking gateway";
        }
        else
        {
            withdrawal.Status = WithdrawalStatus.Rejected;
            withdrawal.ProcessedAt = DateTime.UtcNow;
            withdrawal.AdminNote = request.Note ?? "Rejected: Invalid UPI or verification issue. Refunded to wallet.";
        }

        return Ok(new
        {
            success = true,
            status = withdrawal.Status.ToString(),
            withdrawal
        });
    }

    [HttpGet("merchants")]
    public IActionResult GetMerchants() => Ok(_merchants);

    [HttpPut("merchants/{id}")]
    public IActionResult UpdateMerchant(Guid id, [FromBody] UpdateMerchantDto dto)
    {
        var merchant = _merchants.FirstOrDefault(m => m.Id == id);
        if (merchant == null) return NotFound(new { message = "Merchant not found." });

        if (dto.CashbackRate.HasValue) merchant.CashbackRate = dto.CashbackRate.Value;
        if (dto.IsActive.HasValue) merchant.IsActive = dto.IsActive.Value;

        return Ok(new { success = true, merchant });
    }

    [HttpGet("settings")]
    public IActionResult GetSettings() => Ok(_settings);

    [HttpPut("settings")]
    public IActionResult UpdateSettings([FromBody] UpdateSettingsDto dto)
    {
        if (dto.EntryFeeGrains.HasValue) _settings.EntryFeeGrains = dto.EntryFeeGrains.Value;
        if (dto.DirectBonusGrains.HasValue) _settings.DirectBonusGrains = dto.DirectBonusGrains.Value;
        if (dto.LevelExpansionMultiplier.HasValue) _settings.LevelExpansionMultiplier = dto.LevelExpansionMultiplier.Value;
        if (dto.RegistrationsOpen.HasValue) _settings.RegistrationsOpen = dto.RegistrationsOpen.Value;

        return Ok(new { success = true, settings = _settings });
    }
}

public record ProcessWithdrawalDto(bool Approved, string? UtrNumber, string? Note);
public record UpdateMerchantDto(decimal? CashbackRate, bool? IsActive);
public record UpdateSettingsDto(int? EntryFeeGrains, int? DirectBonusGrains, int? LevelExpansionMultiplier, bool? RegistrationsOpen);
