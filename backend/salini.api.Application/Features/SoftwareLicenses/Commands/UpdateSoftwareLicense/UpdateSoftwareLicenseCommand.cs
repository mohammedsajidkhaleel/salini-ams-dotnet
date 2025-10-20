using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SoftwareLicense;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SoftwareLicenses.Commands.UpdateSoftwareLicense;

public record UpdateSoftwareLicenseCommand : IRequest<SoftwareLicenseDto>
{
    public string Id { get; init; } = string.Empty;
    public string SoftwareName { get; init; } = string.Empty;
    public string? LicenseKey { get; init; }
    public string? LicenseType { get; init; }
    public int? Seats { get; init; }
    public string? Vendor { get; init; }
    public DateTime? PurchaseDate { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public decimal? Cost { get; init; }
    public salini.api.Domain.Enums.SoftwareLicenseStatus Status { get; init; }
    public string? Notes { get; init; }
    public string? PoNumber { get; init; }
    public string ProjectId { get; init; } = string.Empty;
}

public class UpdateSoftwareLicenseCommandHandler : IRequestHandler<UpdateSoftwareLicenseCommand, SoftwareLicenseDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSoftwareLicenseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SoftwareLicenseDto> Handle(UpdateSoftwareLicenseCommand request, CancellationToken cancellationToken)
    {
        var softwareLicense = await _context.SoftwareLicenses
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses)
                .ThenInclude(esl => esl.Employee)
            .FirstOrDefaultAsync(sl => sl.Id == request.Id, cancellationToken);

        if (softwareLicense == null)
        {
            throw new KeyNotFoundException($"Software license with ID {request.Id} not found.");
        }

        // Update properties
        softwareLicense.SoftwareName = request.SoftwareName;
        softwareLicense.LicenseKey = request.LicenseKey;
        softwareLicense.LicenseType = request.LicenseType;
        softwareLicense.Seats = request.Seats;
        softwareLicense.Vendor = request.Vendor;
        softwareLicense.PurchaseDate = request.PurchaseDate;
        softwareLicense.ExpiryDate = request.ExpiryDate;
        softwareLicense.Cost = request.Cost;
        softwareLicense.Status = request.Status;
        softwareLicense.Notes = request.Notes;
        softwareLicense.PoNumber = request.PoNumber;
        softwareLicense.ProjectId = request.ProjectId;
        softwareLicense.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        softwareLicense.UpdatedBy = "System"; // TODO: Get from current user context

        await _context.SaveChangesAsync(cancellationToken);

        return new SoftwareLicenseDto
        {
            Id = softwareLicense.Id,
            SoftwareName = softwareLicense.SoftwareName,
            LicenseKey = softwareLicense.LicenseKey,
            LicenseType = softwareLicense.LicenseType,
            Seats = softwareLicense.Seats,
            Vendor = softwareLicense.Vendor,
            PurchaseDate = softwareLicense.PurchaseDate,
            ExpiryDate = softwareLicense.ExpiryDate,
            Cost = softwareLicense.Cost,
            Status = softwareLicense.Status,
            Notes = softwareLicense.Notes,
            PoNumber = softwareLicense.PoNumber,
            ProjectId = softwareLicense.ProjectId,
            ProjectName = softwareLicense.Project?.Name,
            AssignedEmployeeId = softwareLicense.EmployeeSoftwareLicenses
                .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                .Select(esl => esl.EmployeeId)
                .FirstOrDefault(),
            AssignedEmployeeName = softwareLicense.EmployeeSoftwareLicenses
                .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                .Select(esl => esl.Employee != null ? $"{esl.Employee.FirstName} {esl.Employee.LastName}" : null)
                .FirstOrDefault(),
            AssignmentDate = softwareLicense.EmployeeSoftwareLicenses
                .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
                .Select(esl => esl.AssignedDate)
                .FirstOrDefault(),
            CreatedAt = softwareLicense.CreatedAt,
            CreatedBy = softwareLicense.CreatedBy,
            UpdatedAt = softwareLicense.UpdatedAt,
            UpdatedBy = softwareLicense.UpdatedBy
        };
    }
}
