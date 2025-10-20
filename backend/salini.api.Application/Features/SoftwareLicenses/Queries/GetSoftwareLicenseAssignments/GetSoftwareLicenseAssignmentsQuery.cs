using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SoftwareLicense;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SoftwareLicenses.Queries.GetSoftwareLicenseAssignments;

public record GetSoftwareLicenseAssignmentsQuery(string SoftwareLicenseId) : IQuery<IEnumerable<SoftwareLicenseAssignmentListDto>>;

public class GetSoftwareLicenseAssignmentsQueryHandler : IRequestHandler<GetSoftwareLicenseAssignmentsQuery, IEnumerable<SoftwareLicenseAssignmentListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSoftwareLicenseAssignmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SoftwareLicenseAssignmentListDto>> Handle(GetSoftwareLicenseAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var assignments = await _context.EmployeeSoftwareLicenses
            .Include(esl => esl.Employee)
            .ThenInclude(e => e.Department)
            .Where(esl => esl.SoftwareLicenseId == request.SoftwareLicenseId && esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
            .OrderByDescending(esl => esl.AssignedDate)
            .Select(esl => new SoftwareLicenseAssignmentListDto
            {
                Id = esl.Id,
                EmployeeId = esl.EmployeeId,
                SoftwareLicenseId = esl.SoftwareLicenseId,
                AssignedDate = esl.AssignedDate,
                ReturnedDate = esl.ReturnedDate,
                Status = esl.Status.ToString(),
                Notes = esl.Notes,
                CreatedAt = esl.CreatedAt,
                EmployeeCode = esl.Employee != null ? esl.Employee.EmployeeId : null,
                EmployeeName = esl.Employee != null ? $"{esl.Employee.FirstName} {esl.Employee.LastName}" : null,
                EmployeeEmail = esl.Employee != null ? esl.Employee.Email : null,
                EmployeeDepartment = esl.Employee != null && esl.Employee.Department != null ? esl.Employee.Department.Name : null
            })
            .ToListAsync(cancellationToken);

        return assignments;
    }
}
