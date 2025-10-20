using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SubDepartments.Commands.DeleteSubDepartment;

public record DeleteSubDepartmentCommand(string Id) : IRequest;

public class DeleteSubDepartmentCommandHandler : IRequestHandler<DeleteSubDepartmentCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteSubDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteSubDepartmentCommand request, CancellationToken cancellationToken)
    {
        var subDepartment = await _context.SubDepartments
            .FirstOrDefaultAsync(sd => sd.Id == request.Id, cancellationToken);

        if (subDepartment == null)
        {
            throw new KeyNotFoundException($"SubDepartment with ID {request.Id} not found.");
        }

        _context.SubDepartments.Remove(subDepartment);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
