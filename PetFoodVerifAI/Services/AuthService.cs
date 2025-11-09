using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using PetFoodVerifAI.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetFoodVerifAI.Services
{
    public class AuthService(
        UserManager<IdentityUser> userManager,
        IConfiguration configuration,
        SignInManager<IdentityUser> signInManager,
        IEmailService emailService) : IAuthService
    {
        private readonly UserManager<IdentityUser> _userManager = userManager;
        private readonly IConfiguration _configuration = configuration;
        private readonly SignInManager<IdentityUser> _signInManager = signInManager;
        private readonly IEmailService _emailService = emailService;

        public async Task<AuthResultDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email);
            if (user == null)
            {
                return new AuthResultDto { Succeeded = false, Errors = [new IdentityError { Description = "Invalid credentials" }] };
            }

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                return new AuthResultDto { Succeeded = false, Errors = [new IdentityError { Description = "Email not confirmed. Please verify your email first." }] };
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginRequest.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                return new AuthResultDto { Succeeded = false, Errors = [new IdentityError { Description = "Invalid credentials" }] };
            }

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email!,
                    Token = token,
                    EmailConfirmed = user.EmailConfirmed
                }
            };
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto registerDto)
        {
            var user = new IdentityUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                EmailConfirmed = false
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                return new AuthResultDto
                {
                    Succeeded = false,
                    Errors = result.Errors
                };
            }

            var verificationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var expiresAt = DateTime.UtcNow.AddHours(24);

            var verificationLink = $"{_configuration["AppUrl"]}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(verificationToken)}";

            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email, verificationToken, verificationLink);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Email sending failed: {ex.Message}");
            }

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Token = string.Empty,
                    EmailConfirmed = false
                }
            };
        }

        public async Task<AuthResultDto> ConfirmEmailAsync(VerifyEmailRequestDto verifyRequest)
        {
            var user = await _userManager.FindByIdAsync(verifyRequest.UserId);
            if (user == null)
            {
                return new AuthResultDto { Succeeded = false, Errors = new[] { new IdentityError { Description = "User not found" } } };
            }

            var decodedToken = Uri.UnescapeDataString(verifyRequest.VerificationToken);
            bool securityStampIsCorrupted = user.SecurityStamp == decodedToken || user.SecurityStamp == verifyRequest.VerificationToken;
            if (securityStampIsCorrupted)
            {
                await _userManager.UpdateSecurityStampAsync(user);
            }

            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
            {
                if (decodedToken != verifyRequest.VerificationToken)
                {
                    result = await _userManager.ConfirmEmailAsync(user, verifyRequest.VerificationToken);
                }
                
                if (!result.Succeeded)
                {
                    return new AuthResultDto
                    {
                        Succeeded = false,
                        Errors = result.Errors.Any() ? result.Errors : new[] { new IdentityError { Description = "Invalid or expired verification token" } }
                    };
                }
            }

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email!,
                    EmailConfirmed = user.EmailConfirmed,
                    Token = token
                }
            };
        }

        public async Task<AuthResultDto> ResendVerificationEmailAsync(ResendVerificationEmailDto resendRequest)
        {
            var user = await _userManager.FindByEmailAsync(resendRequest.Email);
            if (user == null)
            {
                return new AuthResultDto
                {
                    Succeeded = true,
                    Response = new AuthResponseDto { }
                };
            }

            if (user.EmailConfirmed)
            {
                return new AuthResultDto
                {
                    Succeeded = true,
                    Response = new AuthResponseDto { Email = user.Email ?? "" }
                };
            }

            var verificationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            var verificationLink = $"{_configuration["AppUrl"]}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(verificationToken)}";

            try
            {
                await _emailService.SendVerificationEmailAsync(user.Email ?? "", verificationToken, verificationLink);
            }
            catch (Exception ex)
            {
                return new AuthResultDto
                {
                    Succeeded = false,
                    Errors = [new IdentityError { Description = $"Failed to send email: {ex.Message}" }]
                };
            }

            return new AuthResultDto
            {
                Succeeded = true,
                Response = new AuthResponseDto
                {
                    UserId = user.Id,
                    Email = user.Email ?? ""
                }
            };
        }

        private string GenerateJwtToken(IdentityUser user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"]));

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Email, user.Email!),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<AuthResultDto> GoogleLoginAsync(GoogleLoginRequestDto googleRequest)
        {
            try
            {
                var googleClientId = _configuration["Google:ClientId"];

                using var httpClient = new HttpClient();
                var tokenInfoUrl = $"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={Uri.EscapeDataString(googleRequest.GoogleToken)}";

                try
                {
                    var response = await httpClient.GetAsync(tokenInfoUrl);

                    if (!response.IsSuccessStatusCode)
                    {
                        return new AuthResultDto
                        {
                            Succeeded = false,
                            Errors = new[] { new IdentityError { Description = "Invalid or expired Google token" } }
                        };
                    }

                    var jsonContent = await response.Content.ReadAsStringAsync();
                    using var document = System.Text.Json.JsonDocument.Parse(jsonContent);
                    var root = document.RootElement;

                    if (root.TryGetProperty("issued_to", out var issuedTo))
                    {
                        if (issuedTo.GetString() != googleClientId)
                        {
                            return new AuthResultDto
                            {
                                Succeeded = false,
                                Errors = [new IdentityError { Description = "Google token is not for this application" }]
                            };
                        }
                    }

                    var userInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo";
                    var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, userInfoUrl);
                    userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", googleRequest.GoogleToken);

                    var userInfoResponse = await httpClient.SendAsync(userInfoRequest);
                    if (!userInfoResponse.IsSuccessStatusCode)
                    {
                        return new AuthResultDto
                        {
                            Succeeded = false,
                            Errors = [new IdentityError { Description = "Failed to retrieve user information from Google" }]
                        };
                    }

                    var userInfoContent = await userInfoResponse.Content.ReadAsStringAsync();
                    using var userInfoDoc = System.Text.Json.JsonDocument.Parse(userInfoContent);
                    var userRoot = userInfoDoc.RootElement;

                    if (!userRoot.TryGetProperty("email", out var emailElement))
                    {
                        return new AuthResultDto
                        {
                            Succeeded = false,
                            Errors = [new IdentityError { Description = "Could not retrieve email from Google profile" }]
                        };
                    }

                    var email = emailElement.GetString();
                    if (string.IsNullOrEmpty(email))
                    {
                        return new AuthResultDto
                        {
                            Succeeded = false,
                            Errors = [new IdentityError { Description = "Email is empty in Google profile" }]
                        };
                    }

                    var user = await _userManager.FindByEmailAsync(email);
                    if (user == null)
                    {
                        user = new IdentityUser
                        {
                            UserName = email,
                            Email = email,
                            EmailConfirmed = true
                        };

                        var result = await _userManager.CreateAsync(user);
                        if (!result.Succeeded)
                        {
                            return new AuthResultDto
                            {
                                Succeeded = false,
                                Errors = result.Errors
                            };
                        }
                    }
                    else if (!user.EmailConfirmed)
                    {
                        user.EmailConfirmed = true;
                        await _userManager.UpdateAsync(user);
                    }

                    var jwtToken = GenerateJwtToken(user);

                    return new AuthResultDto
                    {
                        Succeeded = true,
                        Response = new AuthResponseDto
                        {
                            UserId = user.Id,
                            Email = user.Email!,
                            Token = jwtToken,
                            EmailConfirmed = user.EmailConfirmed
                        }
                    };
                }
                catch (HttpRequestException)
                {
                    return new AuthResultDto
                    {
                        Succeeded = false,
                        Errors = [new IdentityError { Description = "Failed to validate Google token. Please check your connection and try again." }]
                    };

                }
            }
            catch (Exception ex)
            {
                return new AuthResultDto 
                { 
                    Succeeded = false, 
                    Errors = [new IdentityError { Description = $"Google login failed: {ex.Message}" }] 
                };
            }
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            try
            {
                var normalizedEmail = request.Email.ToLowerInvariant().Trim();
                var user = await _userManager.FindByEmailAsync(normalizedEmail);
                
                if (user == null)
                {
                    System.Diagnostics.Debug.WriteLine($"Password reset requested for non-existent email: {normalizedEmail}");
                    return true;
                }
                
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                
                var encodedToken = Uri.EscapeDataString(resetToken);
                var encodedEmail = Uri.EscapeDataString(user.Email ?? "");
                var resetLink = $"{_configuration["AppUrl"]}/reset-password?email={encodedEmail}&token={encodedToken}";
                
                try
                {
                    await _emailService.SendPasswordResetEmailAsync(user.Email ?? "", resetToken, resetLink);
                    System.Diagnostics.Debug.WriteLine($"Password reset email sent successfully to {normalizedEmail}");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Failed to send password reset email: {ex.Message}");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Critical error in ForgotPasswordAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<AuthResultDto> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            try
            {
                var normalizedEmail = request.Email.ToLowerInvariant().Trim();
                var user = await _userManager.FindByEmailAsync(normalizedEmail);
                if (user == null)
                {
                    System.Diagnostics.Debug.WriteLine($"Password reset attempt for non-existent email: {normalizedEmail}");
                    return new AuthResultDto
                    {
                        Succeeded = false,
                        Errors = [new IdentityError { Description = "Invalid or expired password reset token." }]
                    };
                }

                var decodedToken = Uri.UnescapeDataString(request.Token);
                
                var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);
                
                if (!result.Succeeded)
                {
                    if (decodedToken != request.Token)
                    {
                        result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
                    }
                    
                    if (!result.Succeeded)
                    {
                        System.Diagnostics.Debug.WriteLine($"Failed password reset attempt for email {normalizedEmail}");
                        return new AuthResultDto
                        {
                            Succeeded = false,
                            Errors = result.Errors.Any()
                                ? result.Errors
                                : [new IdentityError { Description = "Invalid or expired password reset token." }]
                        };
                    }
                }

                System.Diagnostics.Debug.WriteLine($"Password reset successful for user {normalizedEmail}");
                
                return new AuthResultDto
                {
                    Succeeded = true,
                    Response = new AuthResponseDto()
                };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Critical error in ResetPasswordAsync: {ex.Message}");
                return new AuthResultDto
                {
                    Succeeded = false,
                    Errors = [new IdentityError { Description = "An unexpected error occurred." }]
                };
            }
        }
    }
}
