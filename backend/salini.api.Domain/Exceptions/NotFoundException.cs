namespace salini.api.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, string id) 
        : base($"{entityName} with ID '{id}' was not found.")
    {
    }

    public NotFoundException(string message) : base(message)
    {
    }
}
