using salini.api.Domain.Entities;

namespace salini.api.Domain.Events;

public record AssetAssignedEvent : IDomainEvent
{
    public AssetAssignedEvent(Asset asset, Employee employee, DateTime assignedDate)
    {
        AssetId = asset.Id;
        AssetTag = asset.AssetTag;
        EmployeeId = employee.Id;
        EmployeeName = $"{employee.FirstName} {employee.LastName}";
        AssignedDate = assignedDate;
        OccurredOn = DateTime.UtcNow;
    }

    public string AssetId { get; }
    public string AssetTag { get; }
    public string EmployeeId { get; }
    public string EmployeeName { get; }
    public DateTime AssignedDate { get; }
    public DateTime OccurredOn { get; }
    public string EventType => "AssetAssigned";
}
