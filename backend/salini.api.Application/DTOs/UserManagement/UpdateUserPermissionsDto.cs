using System.ComponentModel.DataAnnotations;

namespace salini.api.Application.DTOs.UserManagement
{
    public class UpdateUserPermissionsDto
    {
        public string? Role { get; set; }
        
        public List<string>? Permissions { get; set; }
    }
}
