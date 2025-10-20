using FluentValidation;
using salini.api.Application.DTOs.Asset;

namespace salini.api.Application.Common.Validators;

public class AssetCreateDtoValidator : AbstractValidator<AssetCreateDto>
{
    public AssetCreateDtoValidator()
    {
        RuleFor(x => x.AssetTag)
            .NotEmpty().WithMessage("Asset tag is required")
            .MaximumLength(100).WithMessage("Asset tag cannot exceed 100 characters");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Asset name is required")
            .MaximumLength(200).WithMessage("Asset name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
            
        RuleFor(x => x.SerialNumber)
            .MaximumLength(200).WithMessage("Serial number cannot exceed 200 characters");
            
        RuleFor(x => x.Condition)
            .MaximumLength(50).WithMessage("Condition cannot exceed 50 characters");
            
        RuleFor(x => x.PoNumber)
            .MaximumLength(100).WithMessage("PO number cannot exceed 100 characters");
            
        RuleFor(x => x.Location)
            .MaximumLength(200).WithMessage("Location cannot exceed 200 characters");
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project is required");
    }
}

public class AssetUpdateDtoValidator : AbstractValidator<AssetUpdateDto>
{
    public AssetUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Asset ID is required");
            
        RuleFor(x => x.AssetTag)
            .NotEmpty().WithMessage("Asset tag is required")
            .MaximumLength(100).WithMessage("Asset tag cannot exceed 100 characters");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Asset name is required")
            .MaximumLength(200).WithMessage("Asset name cannot exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");
            
        RuleFor(x => x.SerialNumber)
            .MaximumLength(200).WithMessage("Serial number cannot exceed 200 characters");
            
        RuleFor(x => x.Condition)
            .MaximumLength(50).WithMessage("Condition cannot exceed 50 characters");
            
        RuleFor(x => x.PoNumber)
            .MaximumLength(100).WithMessage("PO number cannot exceed 100 characters");
            
        RuleFor(x => x.Location)
            .MaximumLength(200).WithMessage("Location cannot exceed 200 characters");
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project is required");
    }
}

public class AssetAssignmentDtoValidator : AbstractValidator<AssetAssignmentDto>
{
    public AssetAssignmentDtoValidator()
    {
        RuleFor(x => x.AssetId)
            .NotEmpty().WithMessage("Asset ID is required");
            
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required");
    }
}

public class AssetUnassignmentDtoValidator : AbstractValidator<AssetUnassignmentDto>
{
    public AssetUnassignmentDtoValidator()
    {
        RuleFor(x => x.AssetId)
            .NotEmpty().WithMessage("Asset ID is required");
    }
}
