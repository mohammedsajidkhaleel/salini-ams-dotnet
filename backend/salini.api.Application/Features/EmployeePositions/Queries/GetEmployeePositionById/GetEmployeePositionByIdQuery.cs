using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeePositions.Queries.GetEmployeePositionById;

public record GetEmployeePositionByIdQuery(string Id) : IRequest<EmployeePositionDto?>;

public class GetEmployeePositionByIdQueryHandler : IRequestHandler<GetEmployeePositionByIdQuery, EmployeePositionDto?>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeePositionByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeePositionDto?> Handle(GetEmployeePositionByIdQuery request, CancellationToken cancellationToken)
    {
        var employeePosition = await _context.EmployeePositions
            .FirstOrDefaultAsync(ep => ep.Id == request.Id, cancellationToken);

        if (employeePosition == null)
        {
            return null;
        }

        return new EmployeePositionDto
        {
            Id = employeePosition.Id,
            Name = employeePosition.Name,
            Description = employeePosition.Description,
            Status = employeePosition.Status.ToString(),
            CreatedAt = employeePosition.CreatedAt,
            CreatedBy = employeePosition.CreatedBy,
            UpdatedAt = employeePosition.UpdatedAt,
            UpdatedBy = employeePosition.UpdatedBy
        };
    }
}
