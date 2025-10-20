using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace salini.api.Application.Features.Employees.Commands.ImportEmployees;

public record ImportEmployeesCommand : ICommand<ImportEmployeesResult>
{
    public List<EmployeeImportDto> Employees { get; init; } = new();
}

public class ImportEmployeesCommandHandler : IRequestHandler<ImportEmployeesCommand, ImportEmployeesResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ImportEmployeesCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ImportEmployeesResult> Handle(ImportEmployeesCommand request, CancellationToken cancellationToken)
    {
        var result = new ImportEmployeesResult
        {
            Success = true,
            Imported = 0,
            Updated = 0,
            Errors = new List<ImportError>()
        };

        // Get existing employees for upsert logic
        var existingEmployees = await _context.Employees
            .ToDictionaryAsync(e => e.EmployeeId, e => e, cancellationToken);

        // Get master data for validation
        var departments = await _context.Departments.ToListAsync(cancellationToken);
        var subDepartments = await _context.SubDepartments.ToListAsync(cancellationToken);
        var companies = await _context.Companies.ToListAsync(cancellationToken);
        var projects = await _context.Projects.ToListAsync(cancellationToken);
        var nationalities = await _context.Nationalities.ToListAsync(cancellationToken);
        var employeeCategories = await _context.EmployeeCategories.ToListAsync(cancellationToken);
        var employeePositions = await _context.EmployeePositions.ToListAsync(cancellationToken);
        var costCenters = await _context.CostCenters.ToListAsync(cancellationToken);

        // Collect unique master data values from employees
        var uniqueDepartments = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.DepartmentName))
            .Select(e => e.DepartmentName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueSubDepartments = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.SubDepartmentName))
            .Select(e => e.SubDepartmentName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueCompanies = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.CompanyName))
            .Select(e => e.CompanyName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueProjects = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.ProjectName))
            .Select(e => e.ProjectName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueNationalities = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.NationalityName))
            .Select(e => e.NationalityName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueCategories = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.EmployeeCategoryName))
            .Select(e => e.EmployeeCategoryName!.Trim())
            .Distinct()
            .ToList();
        
        var uniquePositions = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.EmployeePositionName))
            .Select(e => e.EmployeePositionName!.Trim())
            .Distinct()
            .ToList();
        
        var uniqueCostCenters = request.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.CostCenterName))
            .Select(e => e.CostCenterName!.Trim())
            .Distinct()
            .ToList();

        // Create missing master data
        await CreateMissingMasterData(
            request,
            uniqueDepartments, departments, 
            uniqueSubDepartments, subDepartments,
            uniqueCompanies, companies,
            uniqueProjects, projects,
            uniqueNationalities, nationalities,
            uniqueCategories, employeeCategories,
            uniquePositions, employeePositions,
            uniqueCostCenters, costCenters,
            cancellationToken);

        // Refresh master data after creating missing ones
        departments = await _context.Departments.ToListAsync(cancellationToken);
        subDepartments = await _context.SubDepartments.ToListAsync(cancellationToken);
        companies = await _context.Companies.ToListAsync(cancellationToken);
        projects = await _context.Projects.ToListAsync(cancellationToken);
        nationalities = await _context.Nationalities.ToListAsync(cancellationToken);
        employeeCategories = await _context.EmployeeCategories.ToListAsync(cancellationToken);
        employeePositions = await _context.EmployeePositions.ToListAsync(cancellationToken);
        costCenters = await _context.CostCenters.ToListAsync(cancellationToken);

        var employeesToAdd = new List<Employee>();
        var employeesToUpdate = new List<Employee>();
        var processedEmployeeIds = new HashSet<string>();

        for (int i = 0; i < request.Employees.Count; i++)
        {
            var employeeDto = request.Employees[i];
            var rowNumber = i + 1;

            try
            {
                // Check for duplicate employee IDs within the same import batch
                if (processedEmployeeIds.Contains(employeeDto.EmployeeId))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = $"Duplicate Employee ID '{employeeDto.EmployeeId}' found in import data"
                    });
                    continue;
                }
                processedEmployeeIds.Add(employeeDto.EmployeeId);

                // Validate required fields
                if (string.IsNullOrWhiteSpace(employeeDto.EmployeeId))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Employee ID is required"
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(employeeDto.FirstName))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "First Name is required"
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(employeeDto.LastName))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = "Last Name is required"
                    });
                    continue;
                }

                // Validate foreign key references
                string? departmentId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.DepartmentName))
                {
                    var department = departments.FirstOrDefault(d => d.Name.Equals(employeeDto.DepartmentName, StringComparison.OrdinalIgnoreCase));
                    if (department == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Department '{employeeDto.DepartmentName}' not found"
                        });
                        continue;
                    }
                    departmentId = department.Id;
                }

                string? subDepartmentId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.SubDepartmentName))
                {
                    var subDepartment = subDepartments.FirstOrDefault(sd => sd.Name.Equals(employeeDto.SubDepartmentName, StringComparison.OrdinalIgnoreCase));
                    if (subDepartment == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Sub-Department '{employeeDto.SubDepartmentName}' not found"
                        });
                        continue;
                    }
                    subDepartmentId = subDepartment.Id;
                }

                string? companyId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.CompanyName))
                {
                    var company = companies.FirstOrDefault(c => c.Name.Equals(employeeDto.CompanyName, StringComparison.OrdinalIgnoreCase));
                    if (company == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Company '{employeeDto.CompanyName}' not found"
                        });
                        continue;
                    }
                    companyId = company.Id;
                }

                string? projectId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.ProjectName))
                {
                    var project = projects.FirstOrDefault(p => p.Name.Equals(employeeDto.ProjectName, StringComparison.OrdinalIgnoreCase));
                    if (project == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Project '{employeeDto.ProjectName}' not found"
                        });
                        continue;
                    }
                    projectId = project.Id;
                }

                string? nationalityId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.NationalityName))
                {
                    var nationality = nationalities.FirstOrDefault(n => n.Name.Equals(employeeDto.NationalityName, StringComparison.OrdinalIgnoreCase));
                    if (nationality == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Nationality '{employeeDto.NationalityName}' not found"
                        });
                        continue;
                    }
                    nationalityId = nationality.Id;
                }

                string? employeeCategoryId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.EmployeeCategoryName))
                {
                    var category = employeeCategories.FirstOrDefault(c => c.Name.Equals(employeeDto.EmployeeCategoryName, StringComparison.OrdinalIgnoreCase));
                    if (category == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Employee Category '{employeeDto.EmployeeCategoryName}' not found"
                        });
                        continue;
                    }
                    employeeCategoryId = category.Id;
                }

                string? employeePositionId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.EmployeePositionName))
                {
                    var position = employeePositions.FirstOrDefault(p => p.Name.Equals(employeeDto.EmployeePositionName, StringComparison.OrdinalIgnoreCase));
                    if (position == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Employee Position '{employeeDto.EmployeePositionName}' not found"
                        });
                        continue;
                    }
                    employeePositionId = position.Id;
                }

                string? costCenterId = null;
                if (!string.IsNullOrWhiteSpace(employeeDto.CostCenterName))
                {
                    var costCenter = costCenters.FirstOrDefault(cc => cc.Name.Equals(employeeDto.CostCenterName, StringComparison.OrdinalIgnoreCase));
                    if (costCenter == null)
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowNumber,
                            Message = $"Cost Center '{employeeDto.CostCenterName}' not found"
                        });
                        continue;
                    }
                    costCenterId = costCenter.Id;
                }

                // Check if employee exists for upsert logic
                if (existingEmployees.TryGetValue(employeeDto.EmployeeId, out var existingEmployee))
                {
                    // Update existing employee
                    existingEmployee.FirstName = employeeDto.FirstName;
                    existingEmployee.LastName = employeeDto.LastName;
                    existingEmployee.Email = string.IsNullOrWhiteSpace(employeeDto.Email) || employeeDto.Email.Trim() == "-" ? null : employeeDto.Email.Trim();
                    existingEmployee.Phone = string.IsNullOrWhiteSpace(employeeDto.Phone) || employeeDto.Phone.Trim() == "-" ? null : employeeDto.Phone.Trim();
                    existingEmployee.Status = employeeDto.Status ?? existingEmployee.Status;
                    existingEmployee.NationalityId = nationalityId;
                    existingEmployee.DepartmentId = departmentId;
                    existingEmployee.SubDepartmentId = subDepartmentId;
                    existingEmployee.EmployeeCategoryId = employeeCategoryId;
                    existingEmployee.EmployeePositionId = employeePositionId;
                    existingEmployee.ProjectId = projectId;
                    existingEmployee.CompanyId = companyId;
                    existingEmployee.CostCenterId = costCenterId;
                    existingEmployee.UpdatedAt = DateTime.UtcNow;
                    existingEmployee.UpdatedBy = _currentUserService.UserId;

                    employeesToUpdate.Add(existingEmployee);
                }
                else
                {
                    // Create new employee
                    var employee = new Employee
                    {
                        Id = Guid.NewGuid().ToString(),
                        EmployeeId = employeeDto.EmployeeId,
                        FirstName = employeeDto.FirstName,
                        LastName = employeeDto.LastName,
                        Email = string.IsNullOrWhiteSpace(employeeDto.Email) || employeeDto.Email.Trim() == "-" ? null : employeeDto.Email.Trim(),
                        Phone = string.IsNullOrWhiteSpace(employeeDto.Phone) || employeeDto.Phone.Trim() == "-" ? null : employeeDto.Phone.Trim(),
                        Status = employeeDto.Status ?? Status.Active,
                        NationalityId = nationalityId,
                        DepartmentId = departmentId,
                        SubDepartmentId = subDepartmentId,
                        EmployeeCategoryId = employeeCategoryId,
                        EmployeePositionId = employeePositionId,
                        ProjectId = projectId,
                        CompanyId = companyId,
                        CostCenterId = costCenterId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = _currentUserService.UserId
                    };

                    employeesToAdd.Add(employee);
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError
                {
                    Row = rowNumber,
                    Message = $"Unexpected error: {ex.Message}"
                });
            }
        }

        // Save changes to database
        if (employeesToAdd.Any() || employeesToUpdate.Any())
        {
            if (employeesToAdd.Any())
            {
                _context.Employees.AddRange(employeesToAdd);
            }
            
            await _context.SaveChangesAsync(cancellationToken);
            result.Imported = employeesToAdd.Count;
            result.Updated = employeesToUpdate.Count;
        }

        if (result.Errors.Any())
        {
            result.Success = false;
        }

        return result;
    }

    private async Task CreateMissingMasterData(
        ImportEmployeesCommand request,
        List<string> uniqueDepartments, List<Department> existingDepartments,
        List<string> uniqueSubDepartments, List<SubDepartment> existingSubDepartments,
        List<string> uniqueCompanies, List<Company> existingCompanies,
        List<string> uniqueProjects, List<Project> existingProjects,
        List<string> uniqueNationalities, List<Nationality> existingNationalities,
        List<string> uniqueCategories, List<EmployeeCategory> existingCategories,
        List<string> uniquePositions, List<EmployeePosition> existingPositions,
        List<string> uniqueCostCenters, List<CostCenter> existingCostCenters,
        CancellationToken cancellationToken)
    {
        // Create missing departments
        var missingDepartments = uniqueDepartments
            .Where(d => !existingDepartments.Any(ed => ed.Name.Equals(d, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var deptName in missingDepartments)
        {
            var department = new Department
            {
                Id = Guid.NewGuid().ToString(),
                Name = deptName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Departments.Add(department);
        }

        // Create missing sub-departments
        var missingSubDepartments = uniqueSubDepartments
            .Where(sd => !existingSubDepartments.Any(esd => esd.Name.Equals(sd, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        // Get a default department for orphaned sub-departments
        var defaultDepartment = existingDepartments.FirstOrDefault(d => d.Name.Equals("General", StringComparison.OrdinalIgnoreCase));
        var createdDefaultDepartment = false;
        if (defaultDepartment == null)
        {
            // Create a default department if it doesn't exist
            defaultDepartment = new Department
            {
                Id = Guid.NewGuid().ToString(),
                Name = "General",
                Description = "Default department for orphaned sub-departments",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Departments.Add(defaultDepartment);
            createdDefaultDepartment = true;
        }
        
        foreach (var subDeptName in missingSubDepartments)
        {
            // Try to find the most appropriate department for this sub-department
            // by looking at employees who have both department and sub-department
            string? bestDepartmentId = null;
            
            // Find employees that have this sub-department and see what department they belong to
            var employeesWithThisSubDept = request.Employees
                .Where(e => !string.IsNullOrWhiteSpace(e.SubDepartmentName) && 
                           e.SubDepartmentName.Equals(subDeptName, StringComparison.OrdinalIgnoreCase) &&
                           !string.IsNullOrWhiteSpace(e.DepartmentName))
                .ToList();
            
            if (employeesWithThisSubDept.Any())
            {
                // Get the most common department for this sub-department
                var departmentCounts = employeesWithThisSubDept
                    .GroupBy(e => e.DepartmentName)
                    .OrderByDescending(g => g.Count())
                    .ToList();
                
                if (departmentCounts.Any())
                {
                    var mostCommonDeptName = departmentCounts.First().Key;
                    var matchingDept = existingDepartments.FirstOrDefault(d => d.Name.Equals(mostCommonDeptName, StringComparison.OrdinalIgnoreCase));
                    if (matchingDept != null)
                    {
                        bestDepartmentId = matchingDept.Id;
                    }
                }
            }
            
            // Use the best department found, or fall back to default department
            var departmentId = bestDepartmentId ?? defaultDepartment.Id;
            
            var subDepartment = new SubDepartment
            {
                Id = Guid.NewGuid().ToString(),
                Name = subDeptName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                DepartmentId = departmentId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.SubDepartments.Add(subDepartment);
        }

        // Create missing companies
        var missingCompanies = uniqueCompanies
            .Where(c => !existingCompanies.Any(ec => ec.Name.Equals(c, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var companyName in missingCompanies)
        {
            var company = new Company
            {
                Id = Guid.NewGuid().ToString(),
                Name = companyName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Companies.Add(company);
        }

        // Create missing projects
        var missingProjects = uniqueProjects
            .Where(p => !existingProjects.Any(ep => ep.Name.Equals(p, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        // Get existing project codes to avoid duplicates
        var existingProjectCodes = existingProjects.Select(p => p.Code).ToHashSet();
        
        foreach (var projectName in missingProjects)
        {
            // Generate a unique code
            string projectCode;
            int attempt = 0;
            do
            {
                projectCode = $"PROJ_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
                if (attempt > 0)
                {
                    projectCode += $"_{attempt}";
                }
                attempt++;
            } while (existingProjectCodes.Contains(projectCode) && attempt < 100);
            
            // Add the new code to our set to avoid duplicates within this batch
            existingProjectCodes.Add(projectCode);
            
            var project = new Project
            {
                Id = Guid.NewGuid().ToString(),
                Code = projectCode,
                Name = projectName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Projects.Add(project);
        }

        // Create missing nationalities
        var missingNationalities = uniqueNationalities
            .Where(n => !existingNationalities.Any(en => en.Name.Equals(n, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var nationalityName in missingNationalities)
        {
            var nationality = new Nationality
            {
                Id = Guid.NewGuid().ToString(),
                Name = nationalityName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.Nationalities.Add(nationality);
        }

        // Create missing employee categories
        var missingCategories = uniqueCategories
            .Where(c => !existingCategories.Any(ec => ec.Name.Equals(c, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var categoryName in missingCategories)
        {
            var category = new EmployeeCategory
            {
                Id = Guid.NewGuid().ToString(),
                Name = categoryName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.EmployeeCategories.Add(category);
        }

        // Create missing employee positions
        var missingPositions = uniquePositions
            .Where(p => !existingPositions.Any(ep => ep.Name.Equals(p, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var positionName in missingPositions)
        {
            var position = new EmployeePosition
            {
                Id = Guid.NewGuid().ToString(),
                Name = positionName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.EmployeePositions.Add(position);
        }

        // Create missing cost centers
        var missingCostCenters = uniqueCostCenters
            .Where(cc => !existingCostCenters.Any(ecc => ecc.Name.Equals(cc, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        foreach (var costCenterName in missingCostCenters)
        {
            var costCenter = new CostCenter
            {
                Id = Guid.NewGuid().ToString(),
                Name = costCenterName,
                Description = $"Auto-created from employee import",
                Status = Status.Active,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId
            };
            _context.CostCenters.Add(costCenter);
        }

        // Save all new master data
        if (missingDepartments.Any() || missingSubDepartments.Any() || missingCompanies.Any() || missingProjects.Any() || 
            missingNationalities.Any() || missingCategories.Any() || missingPositions.Any() || 
            missingCostCenters.Any() || createdDefaultDepartment)
        {
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                // Log the error and rethrow with more context
                throw new InvalidOperationException($"Failed to save master data during employee import. Error: {ex.Message}", ex);
            }
        }
    }
}

public class ImportEmployeesResult
{
    public bool Success { get; set; }
    public int Imported { get; set; }
    public int Updated { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    public int Row { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class EmployeeImportDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public Status? Status { get; set; }
    public string? DepartmentName { get; set; }
    public string? SubDepartmentName { get; set; }
    public string? CompanyName { get; set; }
    public string? ProjectName { get; set; }
    public string? NationalityName { get; set; }
    public string? EmployeeCategoryName { get; set; }
    public string? EmployeePositionName { get; set; }
    public string? CostCenterName { get; set; }
}
