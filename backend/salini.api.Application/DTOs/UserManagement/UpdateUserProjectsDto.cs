using System.ComponentModel.DataAnnotations;

namespace salini.api.Application.DTOs.UserManagement
{
    public class UpdateUserProjectsDto
    {
        [Required]
        public List<string> ProjectIds { get; set; } = new List<string>();
    }
}
