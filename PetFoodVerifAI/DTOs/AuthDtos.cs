using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} and at max {1} characters long.", MinimumLength = 8)]
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string UserId { get; set; }
        public string Token { get; set; }
    }

    public class AuthResultDto
    {
        public bool Succeeded { get; set; }
        public AuthResponseDto Response { get; set; }
        public IEnumerable<string> Errors { get; set; }
    }

    public class LoginRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
