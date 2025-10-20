using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Employee;

public class EmployeeDto : BaseDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public Status Status { get; set; }
    
    // Foreign Keys
    public string? NationalityId { get; set; }
    public string? EmployeeCategoryId { get; set; }
    public string? EmployeePositionId { get; set; }
    public string? DepartmentId { get; set; }
    public string? SubDepartmentId { get; set; }
    public string? ProjectId { get; set; }
    public string? CompanyId { get; set; }
    public string? CostCenterId { get; set; }
    
    // Navigation properties
    public string? NationalityName { get; set; }
    public string? DepartmentName { get; set; }
    public string? SubDepartmentName { get; set; }
    public string? EmployeeCategoryName { get; set; }
    public string? EmployeePositionName { get; set; }
    public string? ProjectName { get; set; }
    public string? CompanyName { get; set; }
    public string? CostCenterName { get; set; }
}

public class EmployeeCreateDto
{
    [Required]
    [StringLength(50)]
    public string EmployeeId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    public Status Status { get; set; } = Status.Active;
    
    public string? NationalityId { get; set; }
    public string? EmployeeCategoryId { get; set; }
    public string? EmployeePositionId { get; set; }
    public string? DepartmentId { get; set; }
    public string? SubDepartmentId { get; set; }
    public string? ProjectId { get; set; }
    public string? CompanyId { get; set; }
    public string? CostCenterId { get; set; }
}

public class EmployeeUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string EmployeeId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    public Status Status { get; set; }
    
    public string? NationalityId { get; set; }
    public string? EmployeeCategoryId { get; set; }
    public string? EmployeePositionId { get; set; }
    public string? DepartmentId { get; set; }
    public string? SubDepartmentId { get; set; }
    public string? ProjectId { get; set; }
    public string? CompanyId { get; set; }
    public string? CostCenterId { get; set; }
}

public class EmployeeListDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? DepartmentName { get; set; }
    public string? SubDepartmentName { get; set; }
    public string? EmployeePositionName { get; set; }
    public string? ProjectName { get; set; }
    public string? CompanyName { get; set; }
    public Status Status { get; set; }
    public int AssetCount { get; set; }
    public int SimCardCount { get; set; }
    public int SoftwareLicenseCount { get; set; }
}
