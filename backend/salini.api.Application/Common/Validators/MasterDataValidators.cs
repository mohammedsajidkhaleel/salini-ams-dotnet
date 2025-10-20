using FluentValidation;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Application.DTOs.Department;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Application.DTOs.Nationality;
using salini.api.Application.DTOs.Project;
using salini.api.Application.DTOs.SubDepartment;

namespace salini.api.Application.Common.Validators;

// Department Validators
public class DepartmentCreateDtoValidator : AbstractValidator<DepartmentCreateDto>
{
    public DepartmentCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required")
            .MaximumLength(200).WithMessage("Department name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class DepartmentUpdateDtoValidator : AbstractValidator<DepartmentUpdateDto>
{
    public DepartmentUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Department ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required")
            .MaximumLength(200).WithMessage("Department name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

// Project Validators
public class ProjectCreateDtoValidator : AbstractValidator<ProjectCreateDto>
{
    public ProjectCreateDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Project code is required")
            .MaximumLength(50).WithMessage("Project code cannot exceed 50 characters");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required")
            .MaximumLength(200).WithMessage("Project name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
            
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company is required");
    }
}

public class ProjectUpdateDtoValidator : AbstractValidator<ProjectUpdateDto>
{
    public ProjectUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Project ID is required");
            
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Project code is required")
            .MaximumLength(50).WithMessage("Project code cannot exceed 50 characters");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required")
            .MaximumLength(200).WithMessage("Project name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
            
        RuleFor(x => x.CompanyId)
            .NotEmpty().WithMessage("Company is required");
    }
}

// Cost Center Validators
public class CostCenterCreateDtoValidator : AbstractValidator<CostCenterCreateDto>
{
    public CostCenterCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Cost center name is required")
            .MaximumLength(200).WithMessage("Cost center name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
    }
}

public class CostCenterUpdateDtoValidator : AbstractValidator<CostCenterUpdateDto>
{
    public CostCenterUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Cost center ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Cost center name is required")
            .MaximumLength(200).WithMessage("Cost center name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
    }
}

// Nationality Validators
public class NationalityCreateDtoValidator : AbstractValidator<NationalityCreateDto>
{
    public NationalityCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nationality name is required")
            .MaximumLength(200).WithMessage("Nationality name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class NationalityUpdateDtoValidator : AbstractValidator<NationalityUpdateDto>
{
    public NationalityUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Nationality ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nationality name is required")
            .MaximumLength(200).WithMessage("Nationality name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

// Sub Department Validators
public class SubDepartmentCreateDtoValidator : AbstractValidator<SubDepartmentCreateDto>
{
    public SubDepartmentCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Sub department name is required")
            .MaximumLength(200).WithMessage("Sub department name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
            
        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required");
    }
}

public class SubDepartmentUpdateDtoValidator : AbstractValidator<SubDepartmentUpdateDto>
{
    public SubDepartmentUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Sub department ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Sub department name is required")
            .MaximumLength(200).WithMessage("Sub department name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
            
        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required");
    }
}

// Employee Category Validators
public class EmployeeCategoryCreateDtoValidator : AbstractValidator<EmployeeCategoryCreateDto>
{
    public EmployeeCategoryCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee category name is required")
            .MaximumLength(200).WithMessage("Employee category name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class EmployeeCategoryUpdateDtoValidator : AbstractValidator<EmployeeCategoryUpdateDto>
{
    public EmployeeCategoryUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Employee category ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee category name is required")
            .MaximumLength(200).WithMessage("Employee category name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

// Employee Position Validators
public class EmployeePositionCreateDtoValidator : AbstractValidator<EmployeePositionCreateDto>
{
    public EmployeePositionCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee position name is required")
            .MaximumLength(200).WithMessage("Employee position name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class EmployeePositionUpdateDtoValidator : AbstractValidator<EmployeePositionUpdateDto>
{
    public EmployeePositionUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Employee position ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee position name is required")
            .MaximumLength(200).WithMessage("Employee position name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

// Item Category Validators
public class ItemCategoryCreateDtoValidator : AbstractValidator<ItemCategoryCreateDto>
{
    public ItemCategoryCreateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Item category name is required")
            .MaximumLength(200).WithMessage("Item category name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}

public class ItemCategoryUpdateDtoValidator : AbstractValidator<ItemCategoryUpdateDto>
{
    public ItemCategoryUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Item category ID is required");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Item category name is required")
            .MaximumLength(200).WithMessage("Item category name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
    }
}
