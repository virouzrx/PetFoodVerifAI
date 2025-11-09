using Microsoft.AspNetCore.Mvc;
using PetFoodVerifAI.DTOs;
using PetFoodVerifAI.Services;

namespace PetFoodVerifAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService) : ControllerBase
    {
        private readonly IAuthService _authService = authService;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(registerDto);

            if (!result.Succeeded)
            {
                return Conflict(new { Errors = result.Errors });
            }

            return CreatedAtAction(nameof(Register), new { userId = result.Response.UserId }, result.Response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(loginRequest);

            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid email or password.", errors = result.Errors });
            }

            return Ok(result.Response);
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto verifyRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ConfirmEmailAsync(verifyRequest);

            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors });
            }

            return Ok(result.Response);
        }

        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailDto resendRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ResendVerificationEmailAsync(resendRequest);

            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors });
            }

            return Ok(new { Message = "Verification email sent successfully" });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto googleRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.GoogleLoginAsync(googleRequest);

            if (!result.Succeeded)
            {
                return Unauthorized(new { Errors = result.Errors });
            }

            return Ok(result.Response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _authService.ForgotPasswordAsync(request);
                return Ok();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Critical error in ForgotPassword endpoint: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred processing your request" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ResetPasswordAsync(request);

            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors });
            }

            return Ok();
        }
    }
}
