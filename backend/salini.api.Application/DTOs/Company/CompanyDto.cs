using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.Company;

public class CompanyDto : BaseDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; }
}

public class CompanyCreateDto : BaseCreateDto
{
    public Status Status { get; set; } = Status.Active;
}

public class CompanyUpdateDto : BaseUpdateDto
{
    public Status Status { get; set; }
}

public class CompanyListDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Status Status { get; set; }
    public int ProjectCount { get; set; }
    public int EmployeeCount { get; set; }
}
