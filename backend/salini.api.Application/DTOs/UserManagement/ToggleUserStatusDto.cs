using System.ComponentModel.DataAnnotations;

namespace salini.api.Application.DTOs.UserManagement
{
    public class ToggleUserStatusDto
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
