using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Employee;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.Employees.Queries.GetEmployeeReport;

public record GetEmployeeReportQuery(string EmployeeId) : IQuery<EmployeeReportDto>;

public class GetEmployeeReportQueryHandler : IRequestHandler<GetEmployeeReportQuery, EmployeeReportDto>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeeReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeReportDto> Handle(GetEmployeeReportQuery request, CancellationToken cancellationToken)
    {
        // Get employee with all related data
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.SubDepartment)
            .Include(e => e.EmployeePosition)
            .Include(e => e.Project)
            .Include(e => e.Company)
            .Include(e => e.Nationality)
            .Include(e => e.EmployeeAssets)
                .ThenInclude(ea => ea.Asset)
                    .ThenInclude(a => a.Item)
            .Include(e => e.EmployeeAccessories)
                .ThenInclude(ea => ea.Accessory)
            .Include(e => e.EmployeeSoftwareLicenses)
                .ThenInclude(esl => esl.SoftwareLicense)
            .Include(e => e.EmployeeSimCards)
                .ThenInclude(esc => esc.SimCard)
                    .ThenInclude(sc => sc.SimProvider)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee == null)
        {
            throw new salini.api.Domain.Exceptions.NotFoundException($"Employee with ID '{request.EmployeeId}' not found.");
        }

        // Build the report DTO
        var report = new EmployeeReportDto
        {
            Id = employee.Id,
            EmployeeId = employee.EmployeeId,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            FullName = $"{employee.FirstName} {employee.LastName}",
            Email = employee.Email,
            Phone = employee.Phone,
            Address = null, // Not available in Employee entity
            IdNumber = null, // Not available in Employee entity
            JoiningDate = null, // Not available in Employee entity
            Status = employee.Status,
            DepartmentName = employee.Department?.Name,
            SubDepartmentName = employee.SubDepartment?.Name,
            PositionName = employee.EmployeePosition?.Name,
            ProjectName = employee.Project?.Name,
            CompanyName = employee.Company?.Name,
            NationalityName = employee.Nationality?.Name
        };

        // Get assigned assets (only active assignments)
        var assignedAssets = employee.EmployeeAssets
            .Where(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
            .ToList();

        report.Assets = assignedAssets.Select(ea => new EmployeeReportAssetDto
        {
            Id = ea.Asset.Id,
            AssetTag = ea.Asset.AssetTag,
            Name = ea.Asset.Name,
            SerialNumber = ea.Asset.SerialNumber,
            Condition = ea.Asset.Condition,
            ItemName = ea.Asset.Item?.Name,
            AssignedDate = ea.AssignedDate,
            Notes = ea.Notes
        }).ToList();

        // Get assigned accessories (only active assignments)
        var assignedAccessories = employee.EmployeeAccessories
            .Where(ea => ea.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
            .ToList();

        report.Accessories = assignedAccessories.Select(ea => new EmployeeReportAccessoryDto
        {
            Id = ea.Accessory.Id,
            Name = ea.Accessory.Name,
            Description = ea.Accessory.Description,
            Quantity = ea.Quantity,
            AssignedDate = ea.AssignedDate,
            Notes = ea.Notes
        }).ToList();

        // Get assigned software licenses (only active assignments)
        var assignedSoftwareLicenses = employee.EmployeeSoftwareLicenses
            .Where(esl => esl.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
            .ToList();

        report.SoftwareLicenses = assignedSoftwareLicenses.Select(esl => new EmployeeReportSoftwareLicenseDto
        {
            Id = esl.SoftwareLicense.Id,
            SoftwareName = esl.SoftwareLicense.SoftwareName,
            Vendor = esl.SoftwareLicense.Vendor,
            LicenseType = esl.SoftwareLicense.LicenseType,
            AssignedDate = esl.AssignedDate,
            ExpiryDate = esl.SoftwareLicense.ExpiryDate,
            Notes = esl.Notes
        }).ToList();

        // Get assigned SIM cards (only active assignments)
        var assignedSimCards = employee.EmployeeSimCards
            .Where(esc => esc.Status == salini.api.Domain.Enums.AssignmentStatus.Assigned)
            .ToList();

        report.SimCards = assignedSimCards.Select(esc => new EmployeeReportSimCardDto
        {
            Id = esc.SimCard.Id,
            SimAccountNo = esc.SimCard.SimAccountNo,
            SimServiceNo = esc.SimCard.SimServiceNo,
            SimSerialNo = esc.SimCard.SimSerialNo,
            ProviderName = esc.SimCard.SimProvider?.Name,
            PlanName = esc.SimCard.SimCardPlan?.Name,
            AssignedDate = esc.AssignedDate,
            ExpiryDate = null, // Not available in SimCard entity
            Notes = esc.Notes
        }).ToList();

        return report;
    }
}
