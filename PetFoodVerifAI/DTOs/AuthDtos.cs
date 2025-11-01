using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PetFoodVerifAI.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
    }

    public class AuthResultDto
    {
        public bool Succeeded { get; set; }
        public AuthResponseDto Response { get; set; } = new();
        public IEnumerable<IdentityError> Errors { get; set; } = new List<IdentityError>();
    }

    public class LoginRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }

    public class VerifyEmailRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string VerificationToken { get; set; } = string.Empty;
    }

    public class VerifyEmailResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public string Token { get; set; } = string.Empty;
    }

    public class ResendVerificationEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class PendingVerificationResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class GoogleLoginRequestDto
    {
        [Required]
        public string GoogleToken { get; set; } = string.Empty;
    }
}
