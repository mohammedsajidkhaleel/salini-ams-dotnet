namespace salini.api.Domain.Constants;

public static class ValidationMessages
{
    // Common validation messages
    public const string Required = "{0} is required.";
    public const string MaxLength = "{0} cannot exceed {1} characters.";
    public const string MinLength = "{0} must be at least {1} characters.";
    public const string InvalidEmail = "Invalid email format.";
    public const string InvalidPhone = "Invalid phone number format.";
    public const string DuplicateValue = "{0} already exists.";
    public const string InvalidDate = "Invalid date format.";
    public const string FutureDate = "{0} cannot be in the future.";
    public const string PastDate = "{0} cannot be in the past.";
    
    // Entity-specific messages
    public const string EmployeeIdExists = "Employee ID already exists.";
    public const string AssetTagExists = "Asset tag already exists.";
    public const string SerialNumberExists = "Serial number already exists.";
    public const string ProjectCodeExists = "Project code already exists.";
    public const string InvalidQuantity = "Quantity must be greater than 0.";
    public const string InvalidPrice = "Price must be greater than or equal to 0.";
    public const string InvalidSeats = "Number of seats must be greater than 0.";
    public const string ExpiryDateBeforePurchase = "Expiry date cannot be before purchase date.";
    public const string ReturnDateBeforeAssign = "Return date cannot be before assignment date.";
    
    // User management messages
    public const string UserNotFound = "User not found.";
    public const string InvalidCredentials = "Invalid email or password.";
    public const string AccountLocked = "Account is locked.";
    public const string AccountInactive = "Account is inactive.";
    public const string PasswordTooWeak = "Password does not meet security requirements.";
    public const string PermissionDenied = "You do not have permission to perform this action.";
}
