using FluentValidation;
using salini.api.Application.DTOs.SoftwareLicense;

namespace salini.api.Application.Common.Validators;

public class SoftwareLicenseCreateDtoValidator : AbstractValidator<SoftwareLicenseCreateDto>
{
    public SoftwareLicenseCreateDtoValidator()
    {
        RuleFor(x => x.SoftwareName)
            .NotEmpty().WithMessage("Software name is required")
            .MaximumLength(200).WithMessage("Software name cannot exceed 200 characters");
            
        RuleFor(x => x.LicenseKey)
            .MaximumLength(500).WithMessage("License key cannot exceed 500 characters");
            
        RuleFor(x => x.LicenseType)
            .MaximumLength(100).WithMessage("License type cannot exceed 100 characters");
            
        RuleFor(x => x.Seats)
            .GreaterThan(0).WithMessage("Seats must be greater than 0")
            .When(x => x.Seats.HasValue);
            
        RuleFor(x => x.Vendor)
            .MaximumLength(200).WithMessage("Vendor cannot exceed 200 characters");
            
        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Cost cannot be negative")
            .When(x => x.Cost.HasValue);
            
        RuleFor(x => x.ExpiryDate)
            .GreaterThan(x => x.PurchaseDate).WithMessage("Expiry date must be after purchase date")
            .When(x => x.ExpiryDate.HasValue && x.PurchaseDate.HasValue);
            
        RuleFor(x => x.PoNumber)
            .MaximumLength(100).WithMessage("PO number cannot exceed 100 characters");
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project is required");
    }
}

public class SoftwareLicenseUpdateDtoValidator : AbstractValidator<SoftwareLicenseUpdateDto>
{
    public SoftwareLicenseUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Software license ID is required");
            
        RuleFor(x => x.SoftwareName)
            .NotEmpty().WithMessage("Software name is required")
            .MaximumLength(200).WithMessage("Software name cannot exceed 200 characters");
            
        RuleFor(x => x.LicenseKey)
            .MaximumLength(500).WithMessage("License key cannot exceed 500 characters");
            
        RuleFor(x => x.LicenseType)
            .MaximumLength(100).WithMessage("License type cannot exceed 100 characters");
            
        RuleFor(x => x.Seats)
            .GreaterThan(0).WithMessage("Seats must be greater than 0")
            .When(x => x.Seats.HasValue);
            
        RuleFor(x => x.Vendor)
            .MaximumLength(200).WithMessage("Vendor cannot exceed 200 characters");
            
        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Cost cannot be negative")
            .When(x => x.Cost.HasValue);
            
        RuleFor(x => x.ExpiryDate)
            .GreaterThan(x => x.PurchaseDate).WithMessage("Expiry date must be after purchase date")
            .When(x => x.ExpiryDate.HasValue && x.PurchaseDate.HasValue);
            
        RuleFor(x => x.PoNumber)
            .MaximumLength(100).WithMessage("PO number cannot exceed 100 characters");
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project is required");
    }
}

public class SoftwareLicenseAssignmentDtoValidator : AbstractValidator<SoftwareLicenseAssignmentDto>
{
    public SoftwareLicenseAssignmentDtoValidator()
    {
        // SoftwareLicenseId comes from route parameter, not request body
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required");
    }
}

public class SoftwareLicenseUnassignmentDtoValidator : AbstractValidator<SoftwareLicenseUnassignmentDto>
{
    public SoftwareLicenseUnassignmentDtoValidator()
    {
        // SoftwareLicenseId is not required for unassign endpoint
        // The assignmentId from the route is used instead
    }
}
