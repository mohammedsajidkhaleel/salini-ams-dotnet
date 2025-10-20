using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Employee;

public class EmployeeReportDto
{
    // Employee Information
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? IdNumber { get; set; }
    public DateTime? JoiningDate { get; set; }
    public Status Status { get; set; }
    
    // Navigation Properties
    public string? DepartmentName { get; set; }
    public string? SubDepartmentName { get; set; }
    public string? PositionName { get; set; }
    public string? ProjectName { get; set; }
    public string? CompanyName { get; set; }
    public string? NationalityName { get; set; }
    
    // Assigned Items
    public List<EmployeeReportAssetDto> Assets { get; set; } = new();
    public List<EmployeeReportAccessoryDto> Accessories { get; set; } = new();
    public List<EmployeeReportSoftwareLicenseDto> SoftwareLicenses { get; set; } = new();
    public List<EmployeeReportSimCardDto> SimCards { get; set; } = new();
}

public class EmployeeReportAssetDto
{
    public string Id { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? Condition { get; set; }
    public string? ItemName { get; set; }
    public DateTime AssignedDate { get; set; }
    public string? Notes { get; set; }
}

public class EmployeeReportAccessoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public DateTime AssignedDate { get; set; }
    public string? Notes { get; set; }
}

public class EmployeeReportSoftwareLicenseDto
{
    public string Id { get; set; } = string.Empty;
    public string SoftwareName { get; set; } = string.Empty;
    public string? Vendor { get; set; }
    public string? LicenseType { get; set; }
    public DateTime AssignedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}

public class EmployeeReportSimCardDto
{
    public string Id { get; set; } = string.Empty;
    public string SimAccountNo { get; set; } = string.Empty;
    public string SimServiceNo { get; set; } = string.Empty;
    public string? SimSerialNo { get; set; }
    public string? ProviderName { get; set; }
    public string? PlanName { get; set; }
    public DateTime AssignedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}
