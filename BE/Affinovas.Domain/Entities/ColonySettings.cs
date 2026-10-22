using Affinovas.Domain.Common;

namespace Affinovas.Domain.Entities;

public class ColonySettings : BaseEntity
{
    public int EntryFeeGrains { get; set; } = 123;
    public int DirectBonusGrains { get; set; } = 20;
    public int LevelExpansionMultiplier { get; set; } = 5;
    public int MaxLevelsPerBranch { get; set; } = 10;
    public decimal GrainToInrRatio { get; set; } = 1.0m;
    public decimal CashbackToGrainMultiplier { get; set; } = 1.5m;
    public bool RegistrationsOpen { get; set; } = true;
}
