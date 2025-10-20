using MediatR;
using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SoftwareLicense;
using salini.api.Domain.Entities;

namespace salini.api.Application.Features.SoftwareLicenses.Commands.CreateSoftwareLicense;

public record CreateSoftwareLicenseCommand : IRequest<SoftwareLicenseDto>
{
    public string SoftwareName { get; init; } = string.Empty;
    public string? LicenseKey { get; init; }
    public string? LicenseType { get; init; }
    public int? Seats { get; init; }
    public string? Vendor { get; init; }
    public DateTime? PurchaseDate { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public decimal? Cost { get; init; }
    public salini.api.Domain.Enums.SoftwareLicenseStatus Status { get; init; } = salini.api.Domain.Enums.SoftwareLicenseStatus.Active;
    public string? Notes { get; init; }
    public string? PoNumber { get; init; }
    public string ProjectId { get; init; } = string.Empty;
}

public class CreateSoftwareLicenseCommandHandler : IRequestHandler<CreateSoftwareLicenseCommand, SoftwareLicenseDto>
{
    private readonly IApplicationDbContext _context;

    public CreateSoftwareLicenseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SoftwareLicenseDto> Handle(CreateSoftwareLicenseCommand request, CancellationToken cancellationToken)
    {
        var softwareLicense = new SoftwareLicense
        {
            Id = Guid.NewGuid().ToString(),
            SoftwareName = request.SoftwareName,
            LicenseKey = request.LicenseKey,
            LicenseType = request.LicenseType,
            Seats = request.Seats,
            Vendor = request.Vendor,
            PurchaseDate = request.PurchaseDate,
            ExpiryDate = request.ExpiryDate,
            Cost = request.Cost,
            Status = request.Status,
            Notes = request.Notes,
            PoNumber = request.PoNumber,
            ProjectId = request.ProjectId,
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            CreatedBy = "System" // TODO: Get from current user context
        };

        _context.SoftwareLicenses.Add(softwareLicense);
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
            CreatedAt = softwareLicense.CreatedAt,
            CreatedBy = softwareLicense.CreatedBy
        };
    }
}
