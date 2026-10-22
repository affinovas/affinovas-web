using Microsoft.AspNetCore.Mvc;
using Affinovas.Domain.Entities;

namespace Affinovas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private static readonly List<WithdrawalRequest> _withdrawals = new()
    {
        new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            UserEmail = "ramu@affinovas.com",
            UserName = "Ramu AntLeader",
            Amount = 450.00m,
            UpiId = "ramu@okhdfcbank",
            Status = WithdrawalStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-30)
        },
        new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            UserEmail = "mani@affinovas.com",
            UserName = "Mani Ant",
            Amount = 300.00m,
            UpiId = "mani@paytm",
            Status = WithdrawalStatus.Approved,
            UtrNumber = "UTR-9988221044",
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            ProcessedAt = DateTime.UtcNow.AddDays(-1).AddHours(2)
        }
    };

    public static List<WithdrawalRequest> GetInternalWithdrawals() => _withdrawals;

    [HttpPost("withdraw")]
    public IActionResult RequestWithdrawal([FromBody] WithdrawRequestDto request)
    {
        if (request.Amount < 50)
        {
            return BadRequest(new { message = "Minimum withdrawal amount is ₹50." });
        }

        var newReq = new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId != Guid.Empty ? request.UserId : Guid.Parse("22222222-2222-2222-2222-222222222222"),
            UserEmail = request.Email ?? "member@affinovas.com",
            UserName = request.Name ?? "Ant Member",
            Amount = request.Amount,
            UpiId = request.UpiId,
            Status = WithdrawalStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow
        };

        _withdrawals.Insert(0, newReq);

        return Ok(new
        {
            success = true,
            message = $"✓ Payout request for ₹{request.Amount:N2} submitted to {request.UpiId}! Admin review in progress.",
            withdrawal = newReq
        });
    }

    [HttpPost("spin")]
    public IActionResult ClaimSpin([FromBody] SpinClaimDto request)
    {
        return Ok(new
        {
            success = true,
            grainsWon = request.GrainsWon,
            message = $"✓ {request.GrainsWon} Grains successfully credited to your Colony Vault!"
        });
    }

    [HttpPost("swap-cashback")]
    public IActionResult SwapCashback([FromBody] SwapCashbackDto request)
    {
        var grainsEarned = (long)(request.CashbackAmount * 1.5m);
        return Ok(new
        {
            success = true,
            cashbackSwapped = request.CashbackAmount,
            grainsCredited = grainsEarned,
            message = $"✓ Swapped ₹{request.CashbackAmount} for {grainsEarned} Colony Grains (1.5x Multiplier)!"
        });
    }
}

public record WithdrawRequestDto(Guid UserId, string Email, string Name, decimal Amount, string UpiId);
public record SpinClaimDto(Guid UserId, int GrainsWon);
public record SwapCashbackDto(Guid UserId, decimal CashbackAmount);
