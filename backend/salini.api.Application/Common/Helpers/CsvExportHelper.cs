using System.Text;

namespace salini.api.Application.Common.Helpers;

public static class CsvExportHelper
{
    /// <summary>
    /// Escapes a CSV field value
    /// </summary>
    public static string EscapeCsvField(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    /// <summary>
    /// Creates a CSV row from an array of values
    /// </summary>
    public static string CreateCsvRow(params string?[] values)
    {
        return string.Join(",", values.Select(EscapeCsvField));
    }

    /// <summary>
    /// Creates a CSV file content from headers and rows
    /// </summary>
    public static byte[] CreateCsvFile(string[] headers, IEnumerable<string[]> rows)
    {
        var csv = new StringBuilder();
        
        // Add headers
        csv.AppendLine(CreateCsvRow(headers));
        
        // Add rows
        foreach (var row in rows)
        {
            csv.AppendLine(CreateCsvRow(row));
        }
        
        return Encoding.UTF8.GetBytes(csv.ToString());
    }
}

