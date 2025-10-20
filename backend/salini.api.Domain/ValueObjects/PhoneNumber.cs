using System.Text.RegularExpressions;

namespace salini.api.Domain.ValueObjects;

public record PhoneNumber
{
    private static readonly Regex PhoneRegex = new(
        @"^[\+]?[1-9][\d]{0,15}$",
        RegexOptions.Compiled);

    public string Value { get; }

    public PhoneNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Phone number cannot be null or empty", nameof(value));

        // Remove all non-digit characters except +
        var cleaned = Regex.Replace(value, @"[^\d\+]", "");
        
        if (!PhoneRegex.IsMatch(cleaned))
            throw new ArgumentException("Invalid phone number format", nameof(value));

        Value = cleaned;
    }

    public static implicit operator string(PhoneNumber phoneNumber) => phoneNumber.Value;
    public static implicit operator PhoneNumber(string phoneNumber) => new(phoneNumber);

    public override string ToString() => Value;
}
