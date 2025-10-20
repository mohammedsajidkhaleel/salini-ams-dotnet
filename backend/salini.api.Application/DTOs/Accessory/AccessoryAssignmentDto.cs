namespace salini.api.Application.DTOs.Accessory;

public class AccessoryAssignmentDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public int? Quantity { get; set; }
    public string? Notes { get; set; }
}

public class AccessoryUnassignmentDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public int? Quantity { get; set; } // If null, unassign all
    public string? Notes { get; set; }
}
