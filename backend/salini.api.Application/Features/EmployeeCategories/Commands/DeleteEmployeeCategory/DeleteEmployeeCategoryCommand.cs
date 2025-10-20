using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.EmployeeCategories.Commands.DeleteEmployeeCategory;

public record DeleteEmployeeCategoryCommand(string Id) : IRequest;

public class DeleteEmployeeCategoryCommandHandler : IRequestHandler<DeleteEmployeeCategoryCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteEmployeeCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteEmployeeCategoryCommand request, CancellationToken cancellationToken)
    {
        var employeeCategory = await _context.EmployeeCategories
            .FirstOrDefaultAsync(ec => ec.Id == request.Id, cancellationToken);

        if (employeeCategory == null)
        {
            throw new KeyNotFoundException($"Employee category with ID {request.Id} not found.");
        }

        _context.EmployeeCategories.Remove(employeeCategory);
        await _context.SaveChangesAsync(cancellationToken);
    }
}