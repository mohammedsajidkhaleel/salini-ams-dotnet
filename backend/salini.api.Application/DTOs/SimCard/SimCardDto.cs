using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.SimCard;

public class SimCardDto : BaseDto
{
    public string SimAccountNo { get; set; } = string.Empty;
    public string SimServiceNo { get; set; } = string.Empty;
    public DateTime? SimStartDate { get; set; }
    public string? SimTypeId { get; set; }
    public string? SimCardPlanId { get; set; }
    public string? SimProviderId { get; set; }
    public SimCardStatus SimStatus { get; set; } = SimCardStatus.Active;
    public string? SimSerialNo { get; set; }
    public string? AssignedTo { get; set; }
    
    // Foreign Keys
    public string? ProjectId { get; set; }
    
    // Navigation properties
    public string? ProjectName { get; set; }
    public string? SimTypeName { get; set; }
    public string? SimCardPlanName { get; set; }
    public string? SimProviderName { get; set; }
    public string? AssignedEmployeeId { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class SimCardCreateDto
{
    [Required]
    [StringLength(100)]
    public string SimAccountNo { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string SimServiceNo { get; set; } = string.Empty;
    
    public DateTime? SimStartDate { get; set; }
    
    public string? SimTypeId { get; set; }
    
    public string? SimCardPlanId { get; set; }
    
    public string? SimProviderId { get; set; }
    
    public int SimStatus { get; set; } = 1;
    
    [StringLength(200)]
    public string? SimSerialNo { get; set; }
    
    [StringLength(200)]
    public string? AssignedTo { get; set; }
    
    public string? ProjectId { get; set; }
}

public class SimCardUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string SimAccountNo { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string SimServiceNo { get; set; } = string.Empty;
    
    public DateTime? SimStartDate { get; set; }
    
    public string? SimTypeId { get; set; }
    
    public string? SimCardPlanId { get; set; }
    
    public string? SimProviderId { get; set; }
    
    public SimCardStatus SimStatus { get; set; }
    
    [StringLength(200)]
    public string? SimSerialNo { get; set; }
    
    [StringLength(200)]
    public string? AssignedTo { get; set; }
    
    [Required]
    public string ProjectId { get; set; } = string.Empty;
}

public class SimCardListDto
{
    public string Id { get; set; } = string.Empty;
    public string SimAccountNo { get; set; } = string.Empty;
    public string SimServiceNo { get; set; } = string.Empty;
    public DateTime? SimStartDate { get; set; }
    public SimCardStatus SimStatus { get; set; }
    public string? SimSerialNo { get; set; }
    public string? ProjectName { get; set; }
    public string? SimCardPlanName { get; set; }
    public string? SimProviderName { get; set; }
    public string? SimTypeName { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public DateTime? AssignmentDate { get; set; }
}

public class SimCardAssignmentDto
{
    [Required]
    public string SimCardId { get; set; } = string.Empty;
    
    [Required]
    public string EmployeeId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class SimCardUnassignmentDto
{
    [Required]
    public string SimCardId { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}
