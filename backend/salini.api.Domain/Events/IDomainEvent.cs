namespace salini.api.Domain.Events;

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
    string EventType { get; }
}
