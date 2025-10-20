using FluentValidation;
using salini.api.Application.DTOs.SimCard;

namespace salini.api.Application.Common.Validators;

public class SimCardCreateDtoValidator : AbstractValidator<SimCardCreateDto>
{
    public SimCardCreateDtoValidator()
    {
        RuleFor(x => x.SimAccountNo)
            .NotEmpty().WithMessage("SIM account number is required")
            .MaximumLength(100).WithMessage("SIM account number cannot exceed 100 characters");
            
        RuleFor(x => x.SimServiceNo)
            .NotEmpty().WithMessage("SIM service number is required")
            .MaximumLength(100).WithMessage("SIM service number cannot exceed 100 characters");
            
        RuleFor(x => x.SimSerialNo)
            .MaximumLength(200).WithMessage("SIM serial number cannot exceed 200 characters");
            
        RuleFor(x => x.AssignedTo)
            .MaximumLength(200).WithMessage("Assigned to field cannot exceed 200 characters");
    }
}

public class SimCardUpdateDtoValidator : AbstractValidator<SimCardUpdateDto>
{
    public SimCardUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("SIM card ID is required");
            
        RuleFor(x => x.SimAccountNo)
            .NotEmpty().WithMessage("SIM account number is required")
            .MaximumLength(100).WithMessage("SIM account number cannot exceed 100 characters");
            
        RuleFor(x => x.SimServiceNo)
            .NotEmpty().WithMessage("SIM service number is required")
            .MaximumLength(100).WithMessage("SIM service number cannot exceed 100 characters");
            
        RuleFor(x => x.SimSerialNo)
            .MaximumLength(200).WithMessage("SIM serial number cannot exceed 200 characters");
            
        RuleFor(x => x.AssignedTo)
            .MaximumLength(200).WithMessage("Assigned to field cannot exceed 200 characters");
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project is required");
    }
}

public class SimCardAssignmentDtoValidator : AbstractValidator<SimCardAssignmentDto>
{
    public SimCardAssignmentDtoValidator()
    {
        RuleFor(x => x.SimCardId)
            .NotEmpty().WithMessage("SIM card ID is required");
            
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required");
    }
}

public class SimCardUnassignmentDtoValidator : AbstractValidator<SimCardUnassignmentDto>
{
    public SimCardUnassignmentDtoValidator()
    {
        RuleFor(x => x.SimCardId)
            .NotEmpty().WithMessage("SIM card ID is required");
    }
}
