using salini.api.Domain.Entities;

namespace salini.api.Domain.Events;

public record AssetReturnedEvent : IDomainEvent
{
    public AssetReturnedEvent(Asset asset, Employee employee, DateTime returnedDate)
    {
        AssetId = asset.Id;
        AssetTag = asset.AssetTag;
        EmployeeId = employee.Id;
        EmployeeName = $"{employee.FirstName} {employee.LastName}";
        ReturnedDate = returnedDate;
        OccurredOn = DateTime.UtcNow;
    }

    public string AssetId { get; }
    public string AssetTag { get; }
    public string EmployeeId { get; }
    public string EmployeeName { get; }
    public DateTime ReturnedDate { get; }
    public DateTime OccurredOn { get; }
    public string EventType => "AssetReturned";
}
