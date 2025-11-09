using PetFoodVerifAI.DTOs;

namespace PetFoodVerifAI.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResultDto> LoginAsync(LoginRequestDto loginRequest);
        Task<AuthResultDto> ConfirmEmailAsync(VerifyEmailRequestDto verifyRequest);
        Task<AuthResultDto> ResendVerificationEmailAsync(ResendVerificationEmailDto resendRequest);
        Task<AuthResultDto> GoogleLoginAsync(GoogleLoginRequestDto googleRequest);
        Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<AuthResultDto> ResetPasswordAsync(ResetPasswordRequestDto request);
    }
}
