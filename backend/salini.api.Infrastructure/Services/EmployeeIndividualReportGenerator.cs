using System.Drawing;
using System.Globalization;
using FastReport;
using FastReport.Export.PdfSimple;
using FastReport.Utils;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.Employee;
using salini.api.Domain.Enums;

namespace salini.api.Infrastructure.Services;

/// <summary>
/// Builds a printable employee undertaking-style PDF using FastReport Open Source (code-defined layout).
/// </summary>
public sealed class EmployeeIndividualReportGenerator : IEmployeeIndividualReportGenerator
{
    public Task<byte[]> GenerateIndividualReportPdfAsync(EmployeeReportDto data, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using var report = BuildReport(data);
        using var stream = new MemoryStream();
        report.Prepare();
        var export = new PDFSimpleExport();
        export.Export(report, stream);
        return Task.FromResult(stream.ToArray());
    }

    private static Report BuildReport(EmployeeReportDto dto)
    {
        var assets = MapAssets(dto);
        var accessories = MapAccessories(dto);
        var licenses = MapSoftware(dto);
        var sims = MapSimCards(dto);

        var report = new Report();

        report.RegisterData(assets, "Assets");
        report.RegisterData(accessories, "Accessories");
        report.RegisterData(licenses, "SoftwareLicenses");
        report.RegisterData(sims, "SimCards");

        EnableDataSource(report, "Assets");
        EnableDataSource(report, "Accessories");
        EnableDataSource(report, "SoftwareLicenses");
        EnableDataSource(report, "SimCards");

        var page = new ReportPage
        {
            Name = "Page1",
            PaperWidth = Units.Centimeters * 21f,
            PaperHeight = Units.Centimeters * 29.7f,
            LeftMargin = Units.Centimeters * 1f,
            RightMargin = Units.Centimeters * 1f,
            TopMargin = Units.Centimeters * 1f,
            BottomMargin = Units.Centimeters * 1f
        };
        report.Pages.Add(page);

        var title = new ReportTitleBand { Name = "ReportTitle" };
        float y = 0f;
        var contentWidth = Units.Centimeters * 19f;
        const float lineH = 0.45f;
        var cm = Units.Centimeters;

        AddText(title, ref y, contentWidth, cm * lineH, "UNDERTAKING (Issuance and Acceptance of IT Equipment's)",
            HorzAlign.Center, bold: true, fontSize: 12f);
        y += cm * 0.2f;
        AddText(title, ref y, contentWidth, cm * lineH, $"Employee: {dto.FullName}",
            HorzAlign.Center, bold: true, fontSize: 11f);
        y += cm * 0.3f;

        AddText(title, ref y, contentWidth, cm * lineH, $"Employee ID: {dto.EmployeeId}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Email: {dto.Email ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Phone: {dto.Phone ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Status: {FormatStatus(dto.Status)}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Department: {dto.DepartmentName ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Sub-department: {dto.SubDepartmentName ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Position: {dto.PositionName ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Project: {dto.ProjectName ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Company: {dto.CompanyName ?? "—"}");
        AddText(title, ref y, contentWidth, cm * lineH, $"Nationality: {dto.NationalityName ?? "—"}");
        y += cm * 0.2f;
        AddText(title, ref y, contentWidth, cm * lineH,
            $"Generated: {DateTime.UtcNow.ToString("dd MMM yyyy HH:mm", CultureInfo.InvariantCulture)} UTC",
            HorzAlign.Right, bold: false, fontSize: 8f);

        title.Height = y + cm * 0.3f;
        page.ReportTitle = title;

        var usableWidth = page.PaperWidth - page.LeftMargin - page.RightMargin;

        page.Bands.Add(CreateGroupedList(report, "Assigned assets", "Assets", assets.Count, usableWidth,
            "[Assets.AssetTag]  |  [Assets.Name]  |  SN: [Assets.SerialNumber]  |  [Assets.ItemName]  |  [Assets.Condition]  |  [Assets.AssignedDate]"));

        page.Bands.Add(CreateGroupedList(report, "Accessories", "Accessories", accessories.Count, usableWidth,
            "[Accessories.Name]  |  Qty: [Accessories.Quantity]  |  [Accessories.AssignedDate]  |  [Accessories.Description]"));

        page.Bands.Add(CreateGroupedList(report, "Software licenses", "SoftwareLicenses", licenses.Count, usableWidth,
            "[SoftwareLicenses.SoftwareName]  |  [SoftwareLicenses.Vendor]  |  [SoftwareLicenses.LicenseType]  |  [SoftwareLicenses.AssignedDate]  |  Exp: [SoftwareLicenses.ExpiryDate]"));

        page.Bands.Add(CreateGroupedList(report, "SIM cards", "SimCards", sims.Count, usableWidth,
            "[SimCards.SimAccountNo]  |  [SimCards.SimServiceNo]  |  [SimCards.ProviderName]  |  [SimCards.AssignedDate]"));

        return report;
    }

    private static GroupHeaderBand CreateGroupedList(
        Report report,
        string sectionTitle,
        string dataSourceName,
        int rowCount,
        float usableWidth,
        string rowExpression)
    {
        var group = new GroupHeaderBand
        {
            Name = $"Group_{dataSourceName}",
            Height = Units.Centimeters * 0.55f,
            // Single group for the whole table (all rows share the same GroupKey).
            Condition = $"[{dataSourceName}.GroupKey]"
        };

        var headerLabel = new TextObject
        {
            Name = $"Hdr_{dataSourceName}",
            Bounds = new RectangleF(0, 0, usableWidth, Units.Centimeters * 0.55f),
            Text = $"{sectionTitle} ({rowCount})",
            Font = new Font("Arial", 10f, FontStyle.Bold),
            HorzAlign = HorzAlign.Left
        };
        group.Objects.Add(headerLabel);

        var data = new DataBand
        {
            Name = $"Data_{dataSourceName}",
            Height = Units.Centimeters * 0.5f,
            DataSource = report.GetDataSource(dataSourceName)
        };

        var rowText = new TextObject
        {
            Name = $"Row_{dataSourceName}",
            Bounds = new RectangleF(0, 0, usableWidth, Units.Centimeters * 0.5f),
            Text = rowExpression,
            Font = new Font("Arial", 8f),
            WordWrap = true
        };
        data.Objects.Add(rowText);

        group.Data = data;
        return group;
    }

    private static void EnableDataSource(Report report, string name)
    {
        var ds = report.GetDataSource(name);
        if (ds != null)
            ds.Enabled = true;
    }

    private static void AddText(
        ReportTitleBand band,
        ref float y,
        float width,
        float height,
        string text,
        HorzAlign align = HorzAlign.Left,
        bool bold = false,
        float fontSize = 9f)
    {
        var t = new TextObject
        {
            Bounds = new RectangleF(0, y, width, height),
            Text = text,
            HorzAlign = align,
            Font = new Font("Arial", fontSize, bold ? FontStyle.Bold : FontStyle.Regular),
            WordWrap = true
        };
        band.Objects.Add(t);
        y += height;
    }

    private static string FormatStatus(Status status) => status switch
    {
        Status.Active => "Active",
        Status.Inactive => "Inactive",
        _ => status.ToString()
    };

    private static string FormatDate(DateTime dt) =>
        dt.ToString("dd MMM yyyy", CultureInfo.InvariantCulture);

    private static string FormatDate(DateTime? dt) =>
        dt.HasValue ? FormatDate(dt.Value) : "—";

    private static List<AssetReportRow> MapAssets(EmployeeReportDto dto) =>
        dto.Assets.Select(a => new AssetReportRow
        {
            GroupKey = "1",
            AssetTag = a.AssetTag,
            Name = a.Name,
            SerialNumber = a.SerialNumber ?? "",
            ItemName = a.ItemName ?? "",
            Condition = a.Condition ?? "",
            AssignedDate = FormatDate(a.AssignedDate),
            Notes = a.Notes ?? ""
        }).ToList();

    private static List<AccessoryReportRow> MapAccessories(EmployeeReportDto dto) =>
        dto.Accessories.Select(a => new AccessoryReportRow
        {
            GroupKey = "1",
            Name = a.Name,
            Description = a.Description ?? "",
            Quantity = a.Quantity,
            AssignedDate = FormatDate(a.AssignedDate),
            Notes = a.Notes ?? ""
        }).ToList();

    private static List<SoftwareReportRow> MapSoftware(EmployeeReportDto dto) =>
        dto.SoftwareLicenses.Select(s => new SoftwareReportRow
        {
            GroupKey = "1",
            SoftwareName = s.SoftwareName,
            Vendor = s.Vendor ?? "",
            LicenseType = s.LicenseType ?? "",
            AssignedDate = FormatDate(s.AssignedDate),
            ExpiryDate = FormatDate(s.ExpiryDate),
            Notes = s.Notes ?? ""
        }).ToList();

    private static List<SimReportRow> MapSimCards(EmployeeReportDto dto) =>
        dto.SimCards.Select(s => new SimReportRow
        {
            GroupKey = "1",
            SimAccountNo = s.SimAccountNo,
            SimServiceNo = s.SimServiceNo,
            SimSerialNo = s.SimSerialNo ?? "",
            ProviderName = s.ProviderName ?? "",
            PlanName = s.PlanName ?? "",
            AssignedDate = FormatDate(s.AssignedDate),
            ExpiryDate = FormatDate(s.ExpiryDate),
            Notes = s.Notes ?? ""
        }).ToList();

    private sealed class AssetReportRow
    {
        public string GroupKey { get; set; } = "1";
        public string AssetTag { get; set; } = "";
        public string Name { get; set; } = "";
        public string SerialNumber { get; set; } = "";
        public string ItemName { get; set; } = "";
        public string Condition { get; set; } = "";
        public string AssignedDate { get; set; } = "";
        public string Notes { get; set; } = "";
    }

    private sealed class AccessoryReportRow
    {
        public string GroupKey { get; set; } = "1";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int Quantity { get; set; }
        public string AssignedDate { get; set; } = "";
        public string Notes { get; set; } = "";
    }

    private sealed class SoftwareReportRow
    {
        public string GroupKey { get; set; } = "1";
        public string SoftwareName { get; set; } = "";
        public string Vendor { get; set; } = "";
        public string LicenseType { get; set; } = "";
        public string AssignedDate { get; set; } = "";
        public string ExpiryDate { get; set; } = "";
        public string Notes { get; set; } = "";
    }

    private sealed class SimReportRow
    {
        public string GroupKey { get; set; } = "1";
        public string SimAccountNo { get; set; } = "";
        public string SimServiceNo { get; set; } = "";
        public string SimSerialNo { get; set; } = "";
        public string ProviderName { get; set; } = "";
        public string PlanName { get; set; } = "";
        public string AssignedDate { get; set; } = "";
        public string ExpiryDate { get; set; } = "";
        public string Notes { get; set; } = "";
    }
}
