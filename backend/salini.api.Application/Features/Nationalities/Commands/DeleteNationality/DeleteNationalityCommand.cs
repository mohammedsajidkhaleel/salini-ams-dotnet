using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.Nationalities.Commands.DeleteNationality;

public record DeleteNationalityCommand(string Id) : IRequest;

public class DeleteNationalityCommandHandler : IRequestHandler<DeleteNationalityCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteNationalityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteNationalityCommand request, CancellationToken cancellationToken)
    {
        var nationality = await _context.Nationalities
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (nationality == null)
        {
            throw new KeyNotFoundException($"Nationality with ID {request.Id} not found.");
        }

        _context.Nationalities.Remove(nationality);
        await _context.SaveChangesAsync(cancellationToken);
    }
}