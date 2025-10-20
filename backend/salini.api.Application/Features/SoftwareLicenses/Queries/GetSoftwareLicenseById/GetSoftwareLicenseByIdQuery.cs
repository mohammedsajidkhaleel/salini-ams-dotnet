using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SoftwareLicense;

namespace salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenseById;

public record GetSoftwareLicenseByIdQuery(string Id) : IRequest<SoftwareLicenseDto?>;

public class GetSoftwareLicenseByIdQueryHandler : IRequestHandler<GetSoftwareLicenseByIdQuery, SoftwareLicenseDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSoftwareLicenseByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SoftwareLicenseDto?> Handle(GetSoftwareLicenseByIdQuery request, CancellationToken cancellationToken)
    {
        var softwareLicense = await _context.SoftwareLicenses
            .Include(sl => sl.Project)
            .Include(sl => sl.EmployeeSoftwareLicenses)
                .ThenInclude(esl => esl.Employee)
            .FirstOrDefaultAsync(sl => sl.Id == request.Id, cancellationToken);

        if (softwareLicense == null)
            return null;

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
