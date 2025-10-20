using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Project;

public class ProjectDto : BaseDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; }
    public string CompanyId { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
}

public class ProjectCreateDto
{
    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    public Status Status { get; set; } = Status.Active;
    
    [Required]
    public string CompanyId { get; set; } = string.Empty;
}

public class ProjectUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    public Status Status { get; set; }
    
    [Required]
    public string CompanyId { get; set; } = string.Empty;
    
    public string? CostCenterId { get; set; }
    public string? NationalityId { get; set; }
}

public class ProjectListDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CostCenterName { get; set; }
    public string? NationalityName { get; set; }
    public int EmployeeCount { get; set; }
}
