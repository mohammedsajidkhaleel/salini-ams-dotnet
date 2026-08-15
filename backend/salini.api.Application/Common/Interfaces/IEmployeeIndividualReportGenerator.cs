using salini.api.Application.DTOs.Employee;

namespace salini.api.Application.Common.Interfaces;

/// <summary>
/// Generates a PDF individual employee report using FastReport.
/// </summary>
public interface IEmployeeIndividualReportGenerator
{
    Task<byte[]> GenerateIndividualReportPdfAsync(EmployeeReportDto data, CancellationToken cancellationToken = default);
}
