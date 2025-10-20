using System.ComponentModel.DataAnnotations;
using salini.api.Application.DTOs;
using salini.api.Domain.Enums;

namespace salini.api.Application.DTOs.User;

public class UserDto : BaseDto
{
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string? Department { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Permissions { get; set; } = new();
    public List<string> ProjectIds { get; set; } = new();
}

public class UserCreateDto
{
    [Required]
    [StringLength(50)]
    public string UserName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string? Department { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    public List<string> Permissions { get; set; } = new();
    
    public List<string> ProjectIds { get; set; } = new();
}

public class UserUpdateDto
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string UserName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string? Department { get; set; }
    
    [Required]
    public string Role { get; set; } = string.Empty;
    
    public bool IsActive { get; set; }
    
    public List<string> Permissions { get; set; } = new();
    
    public List<string> ProjectIds { get; set; } = new();
}

public class UserListDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int PermissionCount { get; set; }
    public int ProjectCount { get; set; }
}

public class ChangePasswordDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string CurrentPassword { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string NewPassword { get; set; } = string.Empty;
    
    [Required]
    [Compare(nameof(NewPassword))]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string newPassword { get; set; } = string.Empty;
}
