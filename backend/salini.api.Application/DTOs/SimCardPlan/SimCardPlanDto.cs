using System.ComponentModel.DataAnnotations;

namespace salini.api.Application.DTOs.SimCardPlan;

public class SimCardPlanDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DataLimit { get; set; }
    public decimal? MonthlyFee { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class SimCardPlanListDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DataLimit { get; set; }
    public decimal? MonthlyFee { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class SimCardPlanCreateDto
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? DataLimit { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Monthly fee must be a positive number")]
    public decimal? MonthlyFee { get; set; }

    public bool IsActive { get; set; } = true;

    public string? ProviderId { get; set; }
}

public class SimCardPlanUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? DataLimit { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Monthly fee must be a positive number")]
    public decimal? MonthlyFee { get; set; }

    public bool IsActive { get; set; } = true;

    public string? ProviderId { get; set; }
}