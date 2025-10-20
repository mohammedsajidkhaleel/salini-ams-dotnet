namespace salini.api.Domain.Exceptions;

public class DuplicateException : DomainException
{
    public DuplicateException(string entityName, string fieldName, string value) 
        : base($"{entityName} with {fieldName} '{value}' already exists.")
    {
    }

    public DuplicateException(string message) : base(message)
    {
    }
}
