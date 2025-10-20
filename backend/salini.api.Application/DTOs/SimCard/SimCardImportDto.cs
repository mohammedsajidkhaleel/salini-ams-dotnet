using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using salini.api.Application.Features.Employees.Commands.ImportEmployees;

namespace salini.api.Application.DTOs.SimCard;

public class SimCardImportDto
{
    [JsonPropertyName("SimAccountNo")]
    [Required(ErrorMessage = "SIM Account Number is required for unique identification")]
    public string SimAccountNo { get; set; } = string.Empty;

    [JsonPropertyName("SimServiceNo")]
    [Required(ErrorMessage = "SIM Service Number is required for unique identification")]
    public string SimServiceNo { get; set; } = string.Empty;
    
    [JsonPropertyName("SimStartDate")]
    public string? SimStartDate { get; set; }
    
    [JsonPropertyName("SimType")]
    public string? SimType { get; set; }
    
    [JsonPropertyName("SimProvider")]
    public string? SimProvider { get; set; }
    
    [JsonPropertyName("SimCardPlan")]
    public string? SimCardPlan { get; set; }
    
    [JsonPropertyName("SimStatus")]
    public string SimStatus { get; set; } = "active";
    
    [JsonPropertyName("SimSerialNo")]
    public string? SimSerialNo { get; set; }
    
    [JsonPropertyName("AssignedTo")]
    public string? AssignedTo { get; set; }
}

public class ImportSimCardsRequest
{
    [JsonPropertyName("SimCards")]
    [Required]
    public List<SimCardImportDto> SimCards { get; set; } = new();
    
    [JsonPropertyName("ProjectId")]
    public string? ProjectId { get; set; }
}

public class ImportSimCardsResult
{
    public bool Success { get; set; }
    public int Imported { get; set; }
    public int Updated { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}
